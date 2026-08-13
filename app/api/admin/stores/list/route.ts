import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { adminStoreListSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = adminStoreListSchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      subscriptionStatus: searchParams.get("subscriptionStatus") || undefined,
      limit: searchParams.get("limit") || "100",
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "معايير البحث غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { search, status, subscriptionStatus, limit } = parsed.data;

    const stores = await prisma.store.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(subscriptionStatus
          ? { subscription: { status: subscriptionStatus } }
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
      stores: stores.map((store: { id: string; name: string; slug: string; status: string; createdAt: Date; owner: { id: string; name: string; phone: string | null; email: string | null }; subscription: { id: string; status: string; startsAt: Date; endsAt: Date; plan: { id: string; name: string; price: { toString(): string }; billingPeriod: string } } | null }) => ({
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
      { status: 500 }
    );
  }
}
