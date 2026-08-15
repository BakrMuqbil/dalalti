import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function GET() {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminRead);
  if (rateLimitResponse) return rateLimitResponse;

  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        message: "غير مصرح لك بتنفيذ هذا الإجراء",
      },
      { status: 401 }
    );
  }

  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          billingPeriod: "asc",
        },
        {
          price: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      plans: plans.map((plan: { id: string; name: string; billingPeriod: string; price: { toString(): string } }) => ({
        id: plan.id,
        name: plan.name,
        billingPeriod: plan.billingPeriod,
        price: plan.price.toString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminWrite);
  if (rateLimitResponse) return rateLimitResponse;

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "اسم الباقة مطلوب" },
        { status: 400 }
      );
    }
    const name = body.name.trim();

    if (body.billingPeriod !== "MONTHLY" && body.billingPeriod !== "YEARLY") {
      return NextResponse.json(
        { success: false, message: "فترة الفوترة يجب أن تكون شهري أو سنوي" },
        { status: 400 }
      );
    }
    const billingPeriod = body.billingPeriod;

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: "سعر الباقة غير صالح" },
        { status: 400 }
      );
    }

    const duplicate = await prisma.plan.findFirst({
      where: { name, billingPeriod },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "توجد باقة بنفس الاسم وفترة الفوترة" },
        { status: 409 }
      );
    }

    const plan = await prisma.plan.create({
      data: { name, billingPeriod, price },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء الباقة بنجاح",
        plan: {
          id: plan.id,
          name: plan.name,
          billingPeriod: plan.billingPeriod,
          price: plan.price.toString(),
          isActive: plan.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
