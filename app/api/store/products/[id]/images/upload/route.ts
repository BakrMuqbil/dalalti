import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireStoreOwner } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireStoreOwner();

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
    const { id: productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف المنتج مطلوب",
        },
        { status: 400 },
      );
    }

    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId },
      select: { id: true, status: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 },
      );
    }

    if (store.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "المتجر غير نشط" },
        { status: 403 },
      );
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود في متجرك" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "يرجى اختيار صورة",
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

    const fileName = `products/${productId}/${crypto.randomUUID()}.${extension}`;

    const blob = await put(
      fileName,
      buffer,
      {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      },
    );

    return NextResponse.json({
      success: true,
      message: "تم رفع الصورة بنجاح",
      imageUrl: blob.url,
      originalSize: file.size,
      optimizedSize: buffer.length,
      contentType: file.type,
    });
  } catch (error) {
    console.error(
      "Upload product image error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء رفع الصورة",
      },
      { status: 500 },
    );
  }
}