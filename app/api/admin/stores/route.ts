import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/require-auth";
import { adminCreateStoreSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const admin = await requireAdmin();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.adminRead);
  if (rateLimitResponse) return rateLimitResponse;

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || undefined;
    const status = searchParams.get("status") || undefined;
    const planId = searchParams.get("planId") || undefined;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (planId) {
      where.subscription = { planId };
    }

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, phone: true, email: true } },
          subscription: { include: { plan: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stores: stores.map((store: { id: string; name: string; slug: string; status: string; createdAt: Date; owner: { id: string; name: string; phone: string | null; email: string | null }; subscription: { id: string; status: string; startsAt: Date; endsAt: Date; plan: { id: string; name: string; billingPeriod: string; price: { toString(): string } } } | null }) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        createdAt: store.createdAt,
        owner: store.owner,
        subscription: store.subscription
          ? {
              id: store.subscription.id,
              status: store.subscription.status,
              startsAt: store.subscription.startsAt,
              endsAt: store.subscription.endsAt,
              plan: {
                id: store.subscription.plan.id,
                name: store.subscription.plan.name,
                billingPeriod: store.subscription.plan.billingPeriod,
                price: store.subscription.plan.price.toString(),
              },
            }
          : null,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
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
    const rawBody = await request.json();
    const parsed = adminCreateStoreSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, phone, email, password, storeName, slug, planId } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const existingStore = await prisma.store.findUnique({ where: { slug } });

    if (existingStore) {
      return NextResponse.json(
        { success: false, message: "رابط المتجر مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, message: "الباقة غير موجودة أو غير فعالة" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          phone,
          email: email || null,
          passwordHash,
          role: "STORE_OWNER",
        },
      });

      const store = await tx.store.create({
        data: {
          ownerId: user.id,
          name: storeName,
          slug,
          status: "ACTIVE",
        },
      });

      const startsAt = new Date();
      const endsAt = new Date(startsAt);

      if (plan.billingPeriod === "MONTHLY") {
        endsAt.setMonth(endsAt.getMonth() + 1);
      } else {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      }

      const subscription = await tx.subscription.create({
        data: {
          storeId: store.id,
          planId: plan.id,
          status: "ACTIVE",
          startsAt,
          endsAt,
        },
      });

      return { user, store, subscription, plan };
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء المتجر والاشتراك بنجاح",
        store: {
          id: result.store.id,
          name: result.store.name,
          slug: result.store.slug,
          status: result.store.status,
        },
        owner: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          role: result.user.role,
        },
        subscription: {
          id: result.subscription.id,
          status: result.subscription.status,
          startsAt: result.subscription.startsAt,
          endsAt: result.subscription.endsAt,
          plan: {
            id: result.plan.id,
            name: result.plan.name,
            billingPeriod: result.plan.billingPeriod,
            price: result.plan.price.toString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
