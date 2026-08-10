import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getStoreProduct(userId: string, productId: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });

  if (!store) return null;
  if (store.status !== "ACTIVE") return null;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: { id: true },
  });

  if (!product) return null;

  return { storeId: store.id, productId: product.id };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const ownership = await getStoreProduct(auth.userId, id);

    if (!ownership) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: ownership.productId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error("Get product variants error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل المتغيرات",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const ownership = await getStoreProduct(auth.userId, id);

    if (!ownership) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const color =
      typeof body.color === "string"
        ? body.color.trim() || null
        : null;

    const size =
      typeof body.size === "string"
        ? body.size.trim() || null
        : null;

    const price =
      body.price === undefined ||
      body.price === null ||
      body.price === ""
        ? null
        : Number(body.price);

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "سعر المتغير غير صالح",
        },
        { status: 400 }
      );
    }

    if (!color && !size) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تحديد اللون أو المقاس على الأقل",
        },
        { status: 400 }
      );
    }

    const availability =
      body.availability === undefined
        ? "AVAILABLE"
        : body.availability;

    if (
      availability !== "AVAILABLE" &&
      availability !== "UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "حالة التوفر غير صالحة",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.productVariant.findFirst({
      where: {
        productId: ownership.productId,
        color,
        size,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "هذا المتغير موجود بالفعل",
        },
        { status: 409 }
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: ownership.productId,
        color,
        size,
        price,
        availability,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء المتغير بنجاح",
        variant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product variant error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء المتغير",
      },
      { status: 500 }
    );
  }
}
