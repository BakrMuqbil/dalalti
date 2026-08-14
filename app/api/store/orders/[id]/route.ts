import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { updateOrderSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedOrder(userId: string, id: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
  if (!store) return { error: NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 }) };
  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    include: { customer: true, items: { include: { product: true, variant: true } } },
  });
  if (!order) return { error: NextResponse.json({ success: false, message: "الطلب غير موجود" }, { status: 404 }) };
  return { store, order };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await getOwnedOrder(auth.userId, id);
    if (result.error) return result.error;
    return NextResponse.json({
      success: true,
      order: { ...result.order, totalAmount: result.order.totalAmount.toString() },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحميل الطلب" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await getOwnedOrder(auth.userId, id);
    if (result.error) return result.error;
    if (result.store.status !== "ACTIVE") return NextResponse.json({ success: false, message: "المتجر غير نشط" }, { status: 403 });

    const rawBody = await request.json();
    const parsed = updateOrderSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: "لا توجد بيانات لتحديثها" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { customer: true, items: { include: { product: true, variant: true } } },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث الطلب",
      order: { ...order, totalAmount: order.totalAmount.toString() },
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحديث الطلب" }, { status: 500 });
  }
}
