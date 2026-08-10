import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";

async function getStore(userId: string) {
  return prisma.store.findUnique({ where: { ownerId: userId }, select: { id: true, status: true } });
}

export async function GET(request: Request) {
  const auth = await requireStoreOwner();
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const store = await getStore(auth.userId);
    if (!store) return NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

    const validStatuses = new Set(["NEW", "CONFIRMED", "PROCESSING", "READY", "DELIVERED", "CANCELLED"]);
    if (status && !validStatuses.has(status)) return NextResponse.json({ success: false, message: "حالة الطلب غير صالحة" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: { storeId: store.id, ...(status ? { status: status as "NEW" | "CONFIRMED" | "PROCESSING" | "READY" | "DELIVERED" | "CANCELLED" } : {}) },
      include: {
        customer: true,
        items: {
          include: { product: true, variant: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        ...order,
        totalAmount: order.totalAmount.toString(),
        items: order.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          product: { ...item.product, price: item.product.price.toString() },
          variant: item.variant ? { ...item.variant, price: item.variant.price?.toString() ?? null } : null,
        })),
      })),
    });
  } catch (error) {
    console.error("Get store orders error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحميل الطلبات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreOwner();
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const store = await getStore(auth.userId);
    if (!store) return NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 });
    if (store.status !== "ACTIVE") return NextResponse.json({ success: false, message: "المتجر غير نشط" }, { status: 403 });

    const body = await request.json();
    const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerId || rawItems.length === 0) return NextResponse.json({ success: false, message: "العميل وعناصر الطلب مطلوبان" }, { status: 400 });

    const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId: store.id }, select: { id: true } });
    if (!customer) return NextResponse.json({ success: false, message: "العميل غير موجود في متجرك" }, { status: 400 });

    const normalized = rawItems.map((item: unknown) => {
      const value = item as Record<string, unknown>;
      return {
        productId: typeof value.productId === "string" ? value.productId.trim() : "",
        variantId: typeof value.variantId === "string" && value.variantId.trim() ? value.variantId.trim() : null,
        quantity: Number(value.quantity),
      };
    });

    if (normalized.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000)) {
      return NextResponse.json({ success: false, message: "عناصر الطلب غير صالحة" }, { status: 400 });
    }

    const productIds = [...new Set(normalized.map((item) => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, storeId: store.id }, include: { variants: true } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    if (products.length !== productIds.length) return NextResponse.json({ success: false, message: "يوجد منتج غير موجود في متجرك" }, { status: 400 });

    const items = normalized.map((item) => {
      const product = productMap.get(item.productId)!;
      const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : null;
      if (item.variantId && !variant) throw new Error("VARIANT_NOT_FOUND");
      if (product.status !== "ACTIVE" || product.availability !== "AVAILABLE") throw new Error("PRODUCT_UNAVAILABLE");
      if (variant && variant.availability !== "AVAILABLE") throw new Error("VARIANT_UNAVAILABLE");

      const unitPrice = variant?.price ?? product.price;
      const totalPrice = Number(unitPrice) * item.quantity;
      return { ...item, unitPrice, totalPrice };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        status: "NEW",
        totalAmount,
        notes,
        items: {
          create: items.map((item) => ({
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

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الطلب بنجاح",
      order: { ...order, totalAmount: order.totalAmount.toString() },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") return NextResponse.json({ success: false, message: "المتغير غير موجود لهذا المنتج" }, { status: 400 });
    if (error instanceof Error && error.message === "PRODUCT_UNAVAILABLE") return NextResponse.json({ success: false, message: "أحد المنتجات غير متاح حاليًا" }, { status: 400 });
    if (error instanceof Error && error.message === "VARIANT_UNAVAILABLE") return NextResponse.json({ success: false, message: "أحد متغيرات المنتجات غير متاح حاليًا" }, { status: 400 });
    console.error("Create store order error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء إنشاء الطلب" }, { status: 500 });
  }
}
