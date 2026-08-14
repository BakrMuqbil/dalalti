import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { createVariantSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getStoreProduct(userId: string, productId: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });

  if (!store) return null;
  if (store.status !== "ACTIVE") return null;

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    select: { id: true },
  });

  if (!product) return null;

  return { storeId: store.id, productId: product.id };
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
    const ownership = await getStoreProduct(auth.userId, id);

    if (!ownership) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: ownership.productId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, variants });
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
    const ownership = await getStoreProduct(auth.userId, id);

    if (!ownership) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const rawBody = await request.json();
    const parsed = createVariantSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات المتغير غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { color, size, price, availability } = parsed.data;

    if (!color && !size) {
      return NextResponse.json(
        { success: false, message: "يجب تحديد اللون أو المقاس على الأقل" },
        { status: 400 }
      );
    }

    const existing = await prisma.productVariant.findFirst({
      where: { productId: ownership.productId, color, size },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "هذا المتغير موجود بالفعل" },
        { status: 409 }
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: ownership.productId,
        color,
        size,
        price,
        availability,
      },
    });

    return NextResponse.json(
      { success: true, message: "تم إنشاء المتغير بنجاح", variant },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
