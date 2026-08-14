import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { validateUploadedImage } from "@/lib/upload-security";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MAX_DIMENSIONS: [number, number] = [4000, 4000];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.upload);
  if (rateLimitResponse) return rateLimitResponse;

  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        message: "غير مصرح لك بتنفيذ هذا الإجراء",
      },
      { status: 401 },
    );
  }

  try {
    const { id: categoryId } = await context.params;

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف الفئة مطلوب",
        },
        { status: 400 },
      );
    }

    const store = await prisma.store.findUnique({
      where: {
        ownerId: auth.userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "لا يوجد متجر مرتبط بهذا الحساب",
        },
        { status: 404 },
      );
    }

    if (store.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "المتجر غير نشط",
        },
        { status: 403 },
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId: store.id,
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "الفئة غير موجودة في متجرك",
        },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "ملف الصورة مطلوب",
        },
        { status: 400 },
      );
    }

    const validation = await validateUploadedImage(file, {
      maxFileSize: MAX_FILE_SIZE,
      maxDimensions: MAX_DIMENSIONS,
      allowedMimeTypes: ALLOWED_TYPES,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `stores/${store.id}/categories/${category.id}/${crypto.randomUUID()}.${validation.extension}`;

    const blob = await put(fileName, buffer, {
      access: "public",
      contentType: validation.mimeType!,
      addRandomSuffix: false,
    });

    const oldImageUrl = category.imageUrl;

    await prisma.category.update({
      where: { id: category.id },
      data: { imageUrl: blob.url },
    });

    /*
     * حذف الصورة القديمة من Vercel Blob بعد نجاح رفع الصورة الجديدة
     * وتحديث الرابط في قاعدة البيانات.
     * نتجاهل الأخطاء هنا حتى لا نفقد الصورة الجديدة
     * إذا كانت الصورة القديمة غير موجودة أو لم يعد لدينا صلاحية حذفها.
     */
    if (oldImageUrl) {
      try {
        await del(oldImageUrl);
      } catch (cleanupError) {
        console.error(
          "Failed to delete old category image:",
          cleanupError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم رفع صورة الفئة بنجاح",
      imageUrl: blob.url,
      originalSize: file.size,
    });
  } catch (error) {
    console.error("Upload category image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء رفع صورة الفئة",
      },
      { status: 500 },
    );
  }
}