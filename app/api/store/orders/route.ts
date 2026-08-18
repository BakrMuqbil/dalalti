import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { createOrderSchema, orderQuerySchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

async function getStore(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
}

export async function GET(request: Request) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await getStore(auth.userId);
    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = orderQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || "50",
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "معايير البحث غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { status, limit } = parsed.data;

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        items: {
          include: { product: true, variant: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const metadataRows = await prisma.$queryRaw<Array<{ id: string; customer_email: string | null; shipping_city: string | null; shipping_area: string | null; shipping_address: string | null; shipping_notes: string | null; delivery_method: string; payment_method: string; shipping_fee: string }>>`
      SELECT id::text, customer_email, shipping_city, shipping_area, shipping_address, shipping_notes, delivery_method, payment_method, shipping_fee::text
      FROM (
        SELECT o.*, c.email AS customer_email
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.store_id = ${store.id}::uuid
      ) order_meta
      ORDER BY created_at DESC
    `;
    const metadataMap = new Map(metadataRows.map((row) => [row.id, row]));

    return NextResponse.json({
      success: true,
      orders: orders.map((order: any) => {
        const meta = metadataMap.get(order.id);
        return {
        ...order,
        totalAmount: order.totalAmount.toString(),
        items: order.items.map((item: any) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          product: { ...item.product, price: item.product.price.toString() },
          variant: item.variant ? { ...item.variant, price: item.variant.price?.toString() ?? null } : null,
        })),
        customer: order.customer ? { ...order.customer, email: meta?.customer_email ?? null } : order.customer,
        shipping: {
          city: meta?.shipping_city ?? null,
          area: meta?.shipping_area ?? null,
          address: meta?.shipping_address ?? null,
          notes: meta?.shipping_notes ?? null,
        },
        deliveryMethod: meta?.delivery_method ?? "DELIVERY",
        paymentMethod: meta?.payment_method ?? "CASH_ON_DELIVERY",
        shippingFee: meta?.shipping_fee ?? "0",
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await getStore(auth.userId);
    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }
    if (store.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "المتجر غير نشط" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = createOrderSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { customerId, notes, items } = parsed.data;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, storeId: store.id },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "العميل غير موجود في متجرك" },
        { status: 400 }
      );
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
      include: { variants: true },
    });
    const productMap = new Map(products.map((product: any) => [product.id, product]));

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, message: "يوجد منتج غير موجود في متجرك" },
        { status: 400 }
      );
    }

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId) as any;
      const variant = item.variantId ? product.variants.find((candidate: any) => candidate.id === item.variantId) : null;
      if (item.variantId && !variant) throw new Error("VARIANT_NOT_FOUND");
      if (product.status !== "ACTIVE" || product.availability !== "AVAILABLE") throw new Error("PRODUCT_UNAVAILABLE");
      if (variant && variant.availability !== "AVAILABLE") throw new Error("VARIANT_UNAVAILABLE");

      const unitPrice = variant?.price ?? product.price;
      const totalPrice = Number(unitPrice) * item.quantity;
      return { ...item, unitPrice, totalPrice };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        status: "NEW",
        totalAmount,
        notes,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { customer: true, items: { include: { product: true, variant: true } } },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء الطلب بنجاح",
        order: { ...order, totalAmount: order.totalAmount.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "المتغير غير موجود لهذا المنتج" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "PRODUCT_UNAVAILABLE") {
      return NextResponse.json(
        { success: false, message: "أحد المنتجات غير متاح حاليًا" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "VARIANT_UNAVAILABLE") {
      return NextResponse.json(
        { success: false, message: "أحد متغيرات المنتجات غير متاح حاليًا" },
        { status: 400 }
      );
    }
    console.error("Create store order error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء الطلب" },
      { status: 500 }
    );
  }
}
