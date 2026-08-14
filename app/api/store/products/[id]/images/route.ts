import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { createProductImageSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getStoreProduct(authUserId: string, productId: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: authUserId },
    select: { id: true, status: true },
  });

  if (!store) {
    return {
      error: NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      ),
    };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    select: { id: true, storeId: true },
  });

  if (!product) {
    return {
      error: NextResponse.json(
        { success: false, message: "المنتج غير موجود في متجرك" },
        { status: 404 }
      ),
    };
  }

  return { store, product };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAuth();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const result = await getStoreProduct(auth.userId, id);

    if (result.error) {
      return result.error;
    }

    const images = await prisma.productImage.findMany({
      where: { productId: result.product.id },
      orderBy: [
        { isPrimary: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const rawBody = await request.json();
    const parsed = createProductImageSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات الصورة غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { imageUrl, sortOrder, isPrimary } = parsed.data;

    const result = await getStoreProduct(auth.userId, id);

    if (result.error) {
      return result.error;
    }

    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: result.product.id },
        data: { isPrimary: false },
      });
    }

    const imageCount = await prisma.productImage.count({
      where: { productId: result.product.id },
    });

    const finalIsPrimary = imageCount === 0 || isPrimary;

    const image = await prisma.productImage.create({
      data: {
        productId: result.product.id,
        imageUrl,
        sortOrder,
        isPrimary: finalIsPrimary,
      },
    });

    return NextResponse.json(
      { success: true, message: "تمت إضافة الصورة بنجاح", image },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
