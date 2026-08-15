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

    // بيانات الرسوم البيانية — نمو المتاجر خلال آخر 6 أشهر
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const storesByMonth: { month: string; stores: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("ar-SA", { month: "short" });
      const count = await prisma.store.count({
        where: { createdAt: { lte: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) } },
      });
      storesByMonth.push({ month: label, stores: count });
    }

    // توزيع الاشتراكات حسب الحالة
    const subscriptionDistribution = [
      { name: "نشط", value: activeSubscriptions, color: "#16a34a" },
      { name: "منتهي", value: expiredSubscriptions, color: "#dc2626" },
      { name: "ملغى", value: cancelledSubscriptions, color: "#9ca3af" },
    ].filter((item) => item.value > 0);

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
      charts: {
        storeGrowth: storesByMonth,
        subscriptionDistribution,
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
