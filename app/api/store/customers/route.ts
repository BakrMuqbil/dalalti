import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { createCustomerSchema, customerQuerySchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

async function getStore(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
}

export async function GET(request: Request) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await getStore(auth.userId);
    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = customerQuerySchema.safeParse({
      q: searchParams.get("q") || undefined,
      limit: searchParams.get("limit") || "50",
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "معايير البحث غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { q, limit } = parsed.data;

    const customers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreOwner();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await getStore(auth.userId);
    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }
    if (store.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "المتجر غير نشط" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = createCustomerSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات العميل غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, phone, address, notes } = parsed.data;

    const customer = await prisma.customer.create({
      data: { storeId: store.id, name, phone, address, notes },
    });

    return NextResponse.json(
      { success: true, message: "تم إنشاء العميل بنجاح", customer },
      { status: 201 }
    );
  } catch (error) {
    console.error("========================================");
    console.error("CREATE CUSTOMER ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء العميل",
      },
      { status: 500 }
    );
  }
}
