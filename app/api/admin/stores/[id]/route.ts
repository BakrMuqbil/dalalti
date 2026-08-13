import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeStore(store: any) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logoUrl: store.logoUrl,
    phone: store.phone,
    status: store.status,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    owner: store.owner
      ? {
          id: store.owner.id,
          name: store.owner.name,
          phone: store.owner.phone,
          email: store.owner.email,
          role: store.owner.role,
          createdAt: store.owner.createdAt,
        }
      : null,
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
            isActive: store.subscription.plan.isActive,
          },
        }
      : null,
    counts: {
      products: store._count.products,
      categories: store._count.categories,
      customers: store._count.customers,
      orders: store._count.orders,
    },
  };
}

async function getStore(id: string) {
  return prisma.store.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
      _count: {
        select: {
          products: true,
          categories: true,
          customers: true,
          orders: true,
        },
      },
    },
  });
}

function subscriptionEndDate(start: Date, billingPeriod: "MONTHLY" | "YEARLY") {
  const end = new Date(start);
  if (billingPeriod === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const store = await getStore(id);

    if (!store) {
      return NextResponse.json(
        { success: false, message: "المتجر غير موجود" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, store: serializeStore(store) });
  } catch (error) {
    console.error("Admin store details error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل تفاصيل المتجر" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const existing = await getStore(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "المتجر غير موجود" },
        { status: 404 },
      );
    }

    const action = typeof body.action === "string" ? body.action : null;

    if (action === "SUSPEND_STORE" || action === "ACTIVATE_STORE") {
      const status = action === "SUSPEND_STORE" ? "SUSPENDED" : "ACTIVE";
      const store = await prisma.store.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({
        success: true,
        message: status === "ACTIVE" ? "تم تفعيل المتجر" : "تم تجميد المتجر",
        store: { id: store.id, status: store.status },
      });
    }

    if (
      action === "CANCEL_SUBSCRIPTION" ||
      action === "ACTIVATE_SUBSCRIPTION"
    ) {
      if (!existing.subscription) {
        return NextResponse.json(
          { success: false, message: "لا يوجد اشتراك مرتبط بهذا المتجر" },
          { status: 400 },
        );
      }

      const nextStatus =
        action === "CANCEL_SUBSCRIPTION" ? "CANCELLED" : "ACTIVE";
      let startsAt = existing.subscription.startsAt;
      let endsAt = existing.subscription.endsAt;

      if (nextStatus === "ACTIVE" && endsAt <= new Date()) {
        startsAt = new Date();
        endsAt = subscriptionEndDate(startsAt, existing.subscription.plan.billingPeriod);
      }

      const subscription = await prisma.subscription.update({
        where: { id: existing.subscription.id },
        data: { status: nextStatus, startsAt, endsAt },
      });

      return NextResponse.json({
        success: true,
        message:
          nextStatus === "ACTIVE"
            ? "تم تفعيل الاشتراك"
            : "تم إلغاء الاشتراك",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
        },
      });
    }

    if (action === "EXTEND_SUBSCRIPTION") {
      if (!existing.subscription) {
        return NextResponse.json(
          { success: false, message: "لا يوجد اشتراك مرتبط بهذا المتجر" },
          { status: 400 },
        );
      }

      const days = Number(body.days);
      if (!Number.isInteger(days) || days <= 0 || days > 3650) {
        return NextResponse.json(
          { success: false, message: "عدد أيام التمديد غير صالح" },
          { status: 400 },
        );
      }

      const now = new Date();
      const base = existing.subscription.endsAt > now ? existing.subscription.endsAt : now;
      const endsAt = new Date(base);
      endsAt.setDate(endsAt.getDate() + days);

      const subscription = await prisma.subscription.update({
        where: { id: existing.subscription.id },
        data: {
          status: "ACTIVE",
          startsAt:
            existing.subscription.startsAt > now
              ? existing.subscription.startsAt
              : now,
          endsAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم تمديد الاشتراك ${days} يومًا`,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
        },
      });
    }

    if (action === "CHANGE_PLAN") {
      const planId = typeof body.planId === "string" ? body.planId.trim() : "";
      if (!planId) {
        return NextResponse.json(
          { success: false, message: "معرف الباقة مطلوب" },
          { status: 400 },
        );
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) {
        return NextResponse.json(
          { success: false, message: "الباقة غير موجودة أو غير فعالة" },
          { status: 400 },
        );
      }

      if (!existing.subscription) {
        const startsAt = new Date();
        const subscription = await prisma.subscription.create({
          data: {
            storeId: id,
            planId: plan.id,
            status: "ACTIVE",
            startsAt,
            endsAt: subscriptionEndDate(startsAt, plan.billingPeriod),
          },
          include: { plan: true },
        });

        return NextResponse.json({
          success: true,
          message: "تم إنشاء الاشتراك بالباقة المحددة",
          subscription: {
            id: subscription.id,
            status: subscription.status,
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              billingPeriod: subscription.plan.billingPeriod,
              price: subscription.plan.price.toString(),
            },
          },
        });
      }

      const subscription = await prisma.subscription.update({
        where: { id: existing.subscription.id },
        data: { planId: plan.id },
        include: { plan: true },
      });

      return NextResponse.json({
        success: true,
        message: "تم تغيير باقة الاشتراك",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
          plan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            billingPeriod: subscription.plan.billingPeriod,
            price: subscription.plan.price.toString(),
          },
        },
      });
    }

    const storeData: Record<string, unknown> = {};
    const ownerData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { success: false, message: "اسم المتجر غير صالح" },
          { status: 400 },
        );
      }
      storeData.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !body.slug.trim()) {
        return NextResponse.json(
          { success: false, message: "رابط المتجر غير صالح" },
          { status: 400 },
        );
      }
      storeData.slug = body.slug.trim().toLowerCase();
    }

    for (const field of ["description", "logoUrl", "phone"] as const) {
      if (body[field] !== undefined) {
        storeData[field] =
          typeof body[field] === "string" ? body[field].trim() || null : null;
      }
    }

    if (body.status !== undefined) {
      if (body.status !== "ACTIVE" && body.status !== "SUSPENDED") {
        return NextResponse.json(
          { success: false, message: "حالة المتجر غير صالحة" },
          { status: 400 },
        );
      }
      storeData.status = body.status;
    }

    if (body.ownerName !== undefined) {
      if (typeof body.ownerName !== "string" || !body.ownerName.trim()) {
        return NextResponse.json(
          { success: false, message: "اسم المالك غير صالح" },
          { status: 400 },
        );
      }
      ownerData.name = body.ownerName.trim();
    }

    if (body.ownerPhone !== undefined) {
      ownerData.phone =
        typeof body.ownerPhone === "string" ? body.ownerPhone.trim() || null : null;
    }

    if (body.ownerEmail !== undefined) {
      ownerData.email =
        typeof body.ownerEmail === "string" ? body.ownerEmail.trim() || null : null;
    }

    if (body.newPassword !== undefined) {
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
        return NextResponse.json(
          { success: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
          { status: 400 },
        );
      }
      ownerData.passwordHash = await hashPassword(body.newPassword);
    }

    if (Object.keys(storeData).length === 0 && Object.keys(ownerData).length === 0) {
      return NextResponse.json(
        { success: false, message: "لا توجد بيانات لتحديثها" },
        { status: 400 },
      );
    }

    if (storeData.slug && storeData.slug !== existing.slug) {
      const duplicate = await prisma.store.findFirst({
        where: { slug: String(storeData.slug), NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "رابط المتجر مستخدم بالفعل" },
          { status: 409 },
        );
      }
    }

    if (ownerData.phone !== undefined || ownerData.email !== undefined) {
      const or: Array<Record<string, string | null>> = [];
      if (ownerData.phone !== undefined && ownerData.phone !== null) {
        or.push({ phone: String(ownerData.phone) });
      }
      if (ownerData.email !== undefined && ownerData.email !== null) {
        or.push({ email: String(ownerData.email) });
      }
      if (or.length > 0) {
        const duplicate = await prisma.user.findFirst({
          where: {
            OR: or,
            NOT: { id: existing.owner.id },
          },
          select: { id: true },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, message: "رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل" },
            { status: 409 },
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(ownerData).length > 0) {
        await tx.user.update({ where: { id: existing.owner.id }, data: ownerData });
      }
      if (Object.keys(storeData).length > 0) {
        await tx.store.update({ where: { id }, data: storeData });
      }
    });

    const updated = await getStore(id);
    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المتجر والحساب",
      store: updated ? serializeStore(updated) : null,
    });
  } catch (error) {
    console.error("Admin update store error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث المتجر" },
      { status: 500 },
    );
  }
}
