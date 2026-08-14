import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: Request) {
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
    const store = await prisma.store.findUnique({
      where: {
        ownerId: auth.userId,
      },
      select: {
        id: true,
        status: true,
        logoUrl: true,
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

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو GIF أو AVIF",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "حجم الصورة يجب ألا يتجاوز 10MB",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/gif"
              ? "gif"
              : "avif";

    const fileName = `stores/${store.id}/logo/${crypto.randomUUID()}.${extension}`;

    const blob = await put(fileName, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    const oldLogoUrl = store.logoUrl;

    await prisma.store.update({
      where: { id: store.id },
      data: { logoUrl: blob.url },
    });

    /*
     * حذف الشعار القديم من Vercel Blob بعد نجاح رفع الجديد
     * وتحديث قاعدة البيانات.
     * نتجاهل الأخطاء حتى لا نفقد الشعار الجديد
     * إذا كان القديم غير موجود أو لم يعد لدينا صلاحية حذفه.
     */
    if (oldLogoUrl) {
      try {
        await del(oldLogoUrl);
      } catch (cleanupError) {
        console.error("Failed to delete old store logo:", cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم رفع شعار المتجر بنجاح",
      logoUrl: blob.url,
      originalSize: file.size,
    });
  } catch (error) {
    console.error("Upload store logo error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء رفع شعار المتجر",
      },
      { status: 500 },
    );
  }
}
