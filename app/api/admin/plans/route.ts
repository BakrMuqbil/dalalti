import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET() {
  const admin = await requireAdmin();

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
      plans: plans.map((plan) => ({
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
