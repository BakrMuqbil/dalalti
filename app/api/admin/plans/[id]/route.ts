import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { updatePlanSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminRead);
  if (rateLimitResponse) return rateLimitResponse;
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
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminWrite);
  if (rateLimitResponse) return rateLimitResponse;
  if (!admin) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const { id } = await context.params;
    const rawBody = await request.json();
    const parsed = updatePlanSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات الباقة غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const data = parsed.data;
    const current = await prisma.plan.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, message: "الباقة غير موجودة" }, { status: 404 });

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: "لا توجد بيانات لتحديثها" }, { status: 400 });
    }

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
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminWrite);
  if (rateLimitResponse) return rateLimitResponse;
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
    return handleApiError(error);
  }
}
