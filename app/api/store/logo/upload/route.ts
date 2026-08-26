import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { validateUploadedImage } from "@/lib/upload-security";
import { optimizeImage } from "@/lib/image-processing";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MAX_DIMENSIONS: [number, number] = [4000, 4000];

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif"
];

export const runtime = "nodejs";

export async function POST(request: Request) {
    const auth = await requireStoreOwner();

    const reqHeaders = await headers();

    const rateLimitResponse = applyRateLimit(
        reqHeaders,
        rateLimitPresets.upload
    );

    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    if (!auth) {
        return NextResponse.json(
            {
                success: false,
                message: "غير مصرح لك بتنفيذ هذا الإجراء"
            },
            { status: 401 }
        );
    }

    let uploadedBlobUrl: string | null = null;
    let databaseUpdated = false;

    try {
        const store = await prisma.store.findUnique({
            where: {
                ownerId: auth.userId
            },
            select: {
                id: true,
                status: true,
                logoUrl: true
            }
        });

        if (!store) {
            return NextResponse.json(
                {
                    success: false,
                    message: "لا يوجد متجر مرتبط بهذا الحساب"
                },
                { status: 404 }
            );
        }

        if (store.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    message: "المتجر غير نشط"
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ملف الصورة مطلوب"
                },
                { status: 400 }
            );
        }

        const validation = await validateUploadedImage(file, {
            maxFileSize: MAX_FILE_SIZE,
            maxDimensions: MAX_DIMENSIONS,
            allowedMimeTypes: ALLOWED_TYPES
        });

        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error
                },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();

        const originalBuffer = Buffer.from(arrayBuffer);

        const optimized = await optimizeImage(originalBuffer);

        const fileName = `stores/${store.id}/logo/${crypto.randomUUID()}.webp`;

        const blob = await put(
            fileName,
            optimized.buffer,
            {
                access: "public",
                contentType: optimized.contentType,
                addRandomSuffix: false
            }
        );

        uploadedBlobUrl = blob.url;

        const oldLogoUrl = store.logoUrl;

        await prisma.store.update({
            where: {
                id: store.id
            },
            data: {
                logoUrl: blob.url
            }
        });

        databaseUpdated = true;

        /*
         * حذف الشعار القديم بعد نجاح:
         *
         * 1. رفع الصورة الجديدة
         * 2. تحديث قاعدة البيانات
         *
         * إذا فشل الحذف، لا نفشل العملية.
         */
        if (oldLogoUrl && oldLogoUrl !== blob.url) {
            try {
                await del(oldLogoUrl);
            } catch (cleanupError) {
                console.error(
                    "Failed to delete old store logo:",
                    cleanupError
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "تم رفع شعار المتجر وتحسينه بنجاح",

            logoUrl: blob.url,

            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,

            contentType: optimized.contentType,

            width: optimized.width,
            height: optimized.height,

            compressionRatio:
                optimized.originalSize > 0
                    ? Number(
                          (
                              (1 -
                                  optimized.optimizedSize /
                                      optimized.originalSize) *
                              100
                          ).toFixed(1)
                      )
                    : 0
        });
    } catch (error) {
        console.error(
            "Upload store logo error:",
            error
        );

        /*
         * إذا تم رفع الصورة إلى Blob
         * لكن فشل تحديث قاعدة البيانات،
         * نحذف الملف الجديد حتى لا يبقى orphaned.
         */
        if (
            uploadedBlobUrl &&
            !databaseUpdated
        ) {
            try {
                await del(uploadedBlobUrl);
            } catch (cleanupError) {
                console.error(
                    "Failed to cleanup uploaded logo:",
                    cleanupError
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    "حدث خطأ أثناء رفع شعار المتجر"
            },
            { status: 500 }
        );
    }
}