import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { validateUploadedImage } from "@/lib/upload-security";
import { optimizeImage } from "@/lib/image-processing";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// نسمح بالصور الكبيرة مبدئيًا ثم يقوم sharp
// بتصغيرها إلى 1600x1600 قبل التخزين.
const MAX_DIMENSIONS: [number, number] = [8000, 8000];

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

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.upload);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

    // الحصول على المتجر الخاص بالمستخدم
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

    // التأكد أن الفئة تنتمي إلى متجر المستخدم
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

    // قراءة الملف
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

    // ---------------------------------------------------------
    // 1. التحقق الأمني من الصورة
    // ---------------------------------------------------------
    //
    // validateUploadedImage يتحقق من:
    // - حجم الملف
    // - Magic Bytes
    // - MIME الحقيقي
    // - نوع الملف المسموح
    // - أبعاد الصورة
    //
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

    // ---------------------------------------------------------
    // 2. قراءة الصورة إلى Buffer
    // ---------------------------------------------------------
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ---------------------------------------------------------
    // 3. تحسين الصورة باستخدام Sharp
    // ---------------------------------------------------------
    //
    // يتم هنا:
    // - تدوير الصورة حسب EXIF
    // - تصغيرها إلى 1600x1600 كحد أقصى
    // - الحفاظ على نسبة الأبعاد
    // - منع تكبير الصور الصغيرة
    // - تحويلها إلى WebP
    // - ضغطها بجودة 82
    // - إزالة metadata غير الضرورية
    //
    const optimized = await optimizeImage(buffer);

    // ---------------------------------------------------------
    // 4. رفع النسخة المحسنة فقط إلى Vercel Blob
    // ---------------------------------------------------------
    const fileName = `stores/${store.id}/categories/${category.id}/${crypto.randomUUID()}.${optimized.extension}`;

    const blob = await put(fileName, optimized.buffer, {
      access: "public",
      contentType: optimized.contentType,
      addRandomSuffix: false,
    });

    // حفظ رابط الصورة القديمة قبل تحديث قاعدة البيانات
    const oldImageUrl = category.imageUrl;

    // ---------------------------------------------------------
    // 5. تحديث رابط الصورة في قاعدة البيانات
    // ---------------------------------------------------------
    await prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        imageUrl: blob.url,
      },
    });

    // ---------------------------------------------------------
    // 6. حذف الصورة القديمة بعد نجاح الصورة الجديدة
    // ---------------------------------------------------------
    //
    // فشل حذف الصورة القديمة لا يجب أن يؤدي إلى فشل العملية
    // لأن الصورة الجديدة أصبحت محفوظة بالفعل.
    //
    if (oldImageUrl) {
      try {
        await del(oldImageUrl);
      } catch (cleanupError) {
        console.error("Failed to delete old category image:", cleanupError);
      }
    }

    // ---------------------------------------------------------
    // 7. الاستجابة
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      message: "تم رفع صورة الفئة بنجاح",

      imageUrl: blob.url,

      // حجم الصورة الأصلية
      originalSize: optimized.originalSize,

      // حجم الصورة بعد التحسين
      optimizedSize: optimized.optimizedSize,

      // النوع النهائي
      contentType: optimized.contentType,

      // الامتداد النهائي
      extension: optimized.extension,

      // الأبعاد النهائية بعد التحسين
      width: optimized.width,
      height: optimized.height,
    });
  } catch (error) {
    console.error("Upload category image error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء رفع صورة الفئة",
      },
      { status: 500 },
    );
  }
}
