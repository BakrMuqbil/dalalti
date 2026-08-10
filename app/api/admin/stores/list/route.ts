import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const subscriptionStatus = searchParams.get("subscriptionStatus");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 100), 1), 200);

    const storeStatuses = new Set(["ACTIVE", "SUSPENDED"]);
    const subscriptionStatuses = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

    if (status && !storeStatuses.has(status)) {
      return NextResponse.json({ success: false, message: "حالة المتجر غير صالحة" }, { status: 400 });
    }
    if (subscriptionStatus && !subscriptionStatuses.has(subscriptionStatus)) {
      return NextResponse.json({ success: false, message: "حالة الاشتراك غير صالحة" }, { status: 400 });
    }

    const stores = await prisma.store.findMany({
      where: {
        ...(status ? { status: status as "ACTIVE" | "SUSPENDED" } : {}),
        ...(subscriptionStatus
          ? { subscription: { status: subscriptionStatus as "ACTIVE" | "EXPIRED" | "CANCELLED" } }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
                { owner: { name: { contains: search, mode: "insensitive" } } },
                { owner: { phone: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        owner: { select: { id: true, name: true, phone: true, email: true } },
        subscription: {
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            plan: { select: { id: true, name: true, price: true, billingPeriod: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stores: stores.map((store) => ({
        ...store,
        subscription: store.subscription
          ? {
              ...store.subscription,
              plan: { ...store.subscription.plan, price: store.subscription.plan.price.toString() },
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin stores list error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل المتاجر" },
      { status: 500 },
    );
  }
}
