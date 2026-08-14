import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireStoreOwner } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { validateUploadedImage } from "@/lib/upload-security";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSIONS: [number, number] = [8000, 8000];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const runtime = "nodejs";

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

    const fileName = `products/${productId}/${crypto.randomUUID()}.${validation.extension}`;

    const blob = await put(
      fileName,
      buffer,
      {
        access: "public",
        contentType: validation.mimeType!,
        addRandomSuffix: false,
      },
    );

    return NextResponse.json({
      success: true,
      message: "تم رفع الصورة بنجاح",
      imageUrl: blob.url,
      originalSize: file.size,
      optimizedSize: buffer.length,
      contentType: validation.mimeType,
      width: validation.width,
      height: validation.height,
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