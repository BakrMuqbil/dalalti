import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { createProductSchema, productQuerySchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const auth = await requireAuth();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = productQuerySchema.safeParse({
      q: searchParams.get("q") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      availability: searchParams.get("availability") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "معايير البحث غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { q, categoryId, availability, status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const whereConditions: Array<Record<string, unknown>> = [
      { storeId: store.id },
    ];

    if (q) {
      whereConditions.push({
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      });
    }

    if (categoryId) {
      whereConditions.push({ categoryId });
    }

    if (availability) {
      whereConditions.push({ availability });
    }

    if (status) {
      whereConditions.push({ status });
    }

    const where = { AND: whereConditions };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: { total, pages, page, limit },
    });
  } catch (error) {
    console.error("Get store products error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل المنتجات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = createProductSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, description, price, availability, status, categoryId } = parsed.data;

    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId },
      select: { id: true, status: true },
    });

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

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, storeId: store.id },
      });
      if (!category) {
        return NextResponse.json(
          { success: false, message: "التصنيف غير موجود في متجرك" },
          { status: 400 }
        );
      }
    }

    const existingProduct = await prisma.product.findFirst({
      where: { storeId: store.id, name },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, message: "يوجد منتج بهذا الاسم بالفعل" },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId,
        name,
        description,
        price,
        availability,
        status,
      },
      include: { category: true, images: true, variants: true },
    });

    return NextResponse.json(
      { success: true, message: "تم إنشاء المنتج بنجاح", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create store product error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء المنتج" },
      { status: 500 }
    );
  }
}
