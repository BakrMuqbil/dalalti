import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) return NextResponse.json({ success: false, message: "الباقة غير موجودة" }, { status: 404 });

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        billingPeriod: plan.billingPeriod,
        price: plan.price.toString(),
        isActive: plan.isActive,
        subscriptionsCount: plan._count.subscriptions,
      },
    });
  } catch (error) {
    console.error("Admin plan details error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحميل الباقة" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = await request.json();
    const current = await prisma.plan.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, message: "الباقة غير موجودة" }, { status: 404 });

    const data: { name?: string; billingPeriod?: "MONTHLY" | "YEARLY"; price?: number; isActive?: boolean } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ success: false, message: "اسم الباقة غير صالح" }, { status: 400 });
      data.name = body.name.trim();
    }
    if (body.billingPeriod !== undefined) {
      if (body.billingPeriod !== "MONTHLY" && body.billingPeriod !== "YEARLY") return NextResponse.json({ success: false, message: "فترة الفوترة غير صالحة" }, { status: 400 });
      data.billingPeriod = body.billingPeriod;
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ success: false, message: "سعر الباقة غير صالح" }, { status: 400 });
      data.price = price;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return NextResponse.json({ success: false, message: "حالة الباقة غير صالحة" }, { status: 400 });
      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, message: "لا توجد بيانات لتحديثها" }, { status: 400 });

    const name = data.name ?? current.name;
    const billingPeriod = data.billingPeriod ?? current.billingPeriod;
    const duplicate = await prisma.plan.findFirst({
      where: { name, billingPeriod, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) return NextResponse.json({ success: false, message: "توجد باقة بنفس الاسم وفترة الفوترة" }, { status: 409 });

    const plan = await prisma.plan.update({ where: { id }, data });
    return NextResponse.json({
      success: true,
      message: "تم تحديث الباقة",
      plan: { id: plan.id, name: plan.name, billingPeriod: plan.billingPeriod, price: plan.price.toString(), isActive: plan.isActive },
    });
  } catch (error) {
    console.error("Admin update plan error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحديث الباقة" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
    if (!plan) return NextResponse.json({ success: false, message: "الباقة غير موجودة" }, { status: 404 });

    if (plan._count.subscriptions > 0) {
      const updated = await prisma.plan.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        message: "الباقة مرتبطة باشتراكات حالية، لذلك تم تعطيلها بدل حذفها",
        plan: { id: updated.id, isActive: updated.isActive },
      });
    }

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف الباقة" });
  } catch (error) {
    console.error("Admin delete plan error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء حذف الباقة" }, { status: 500 });
  }
}
