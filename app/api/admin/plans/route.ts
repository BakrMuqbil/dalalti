import { NextResponse } from "next/server";
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
    console.error("Admin plans error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل الباقات",
      },
      { status: 500 }
    );
  }
}
