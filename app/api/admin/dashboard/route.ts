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
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const expiringSoon = new Date(now);
    expiringSoon.setDate(expiringSoon.getDate() + 7);

    const [
      totalStores,
      activeStores,
      suspendedStores,
      totalOwners,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      monthlySubscriptions,
      yearlySubscriptions,
      expiringSubscriptions,
      totalProducts,
      totalCustomers,
      totalOrders,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: "ACTIVE" } }),
      prisma.store.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { role: "STORE_OWNER" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
      prisma.subscription.count({ where: { status: "ACTIVE", plan: { billingPeriod: "MONTHLY" } } }),
      prisma.subscription.count({ where: { status: "ACTIVE", plan: { billingPeriod: "YEARLY" } } }),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          endsAt: { gt: now, lte: expiringSoon },
        },
      }),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStores,
        activeStores,
        suspendedStores,
        totalOwners,
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        monthlySubscriptions,
        yearlySubscriptions,
        expiringSubscriptions,
        totalProducts,
        totalCustomers,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل بيانات لوحة الإدارة" },
      { status: 500 },
    );
  }
}
