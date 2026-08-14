import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        message: "غير مسجل الدخول",
      },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: auth.userId,
      },
      include: {
        store: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "المستخدم غير موجود",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,

        store: user.store
          ? {
              id: user.store.id,
              name: user.store.name,
              slug: user.store.slug,
              status: user.store.status,
            }
          : null,

        subscription: user.store?.subscription
          ? {
              id: user.store.subscription.id,
              status: user.store.subscription.status,
              startsAt: user.store.subscription.startsAt,
              endsAt: user.store.subscription.endsAt,

              plan: {
                id: user.store.subscription.plan.id,
                name: user.store.subscription.plan.name,
                billingPeriod:
                  user.store.subscription.plan.billingPeriod,
                price:
                  user.store.subscription.plan.price.toString(),
              },
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
