import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { updateCustomerSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedCustomer(userId: string, id: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
  if (!store) return { error: NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 }) };
  const customer = await prisma.customer.findFirst({
    where: { id, storeId: store.id },
    include: { _count: { select: { orders: true } } },
  });
  if (!customer) return { error: NextResponse.json({ success: false, message: "العميل غير موجود" }, { status: 404 }) };
  return { store, customer };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await getOwnedCustomer(auth.userId, id);
    if (result.error) return result.error;
    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error) {
    console.error("Get customer error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحميل العميل" }, { status: 500 });
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
    const result = await getOwnedCustomer(auth.userId, id);
    if (result.error) return result.error;
    if (result.store.status !== "ACTIVE") return NextResponse.json({ success: false, message: "المتجر غير نشط" }, { status: 403 });

    const rawBody = await request.json();
    const parsed = updateCustomerSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات العميل غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: "لا توجد بيانات لتحديثها" }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json({ success: true, message: "تم تحديث العميل", customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحديث العميل" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await getOwnedCustomer(auth.userId, id);
    if (result.error) return result.error;
    if (result.store.status !== "ACTIVE") return NextResponse.json({ success: false, message: "المتجر غير نشط" }, { status: 403 });

    if (result.customer._count.orders > 0) {
      return NextResponse.json(
        { success: false, message: "لا يمكن حذف عميل لديه طلبات مسجلة. احتفظ به للحفاظ على سجل الطلبات." },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف العميل" });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء حذف العميل" }, { status: 500 });
  }
}
