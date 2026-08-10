import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      {
        success: false,
        message: "غير مصرح لك بتنفيذ هذا الإجراء",
      },
      { status: 401 }
    );
  }

  try {
    const store = await prisma.store.findUnique({
      where: {
        ownerId: auth.userId,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "لا يوجد متجر مرتبط بهذا الحساب",
        },
        { status: 404 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get store products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل المنتجات",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      {
        success: false,
        message: "غير مصرح لك بتنفيذ هذا الإجراء",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const price = body.price;

    const availability =
      body.availability === "UNAVAILABLE"
        ? "UNAVAILABLE"
        : body.availability === "AVAILABLE"
          ? "AVAILABLE"
          : "AVAILABLE";

    const status =
      body.status === "INACTIVE"
        ? "INACTIVE"
        : body.status === "ACTIVE"
          ? "ACTIVE"
          : "ACTIVE";

    const categoryId =
      typeof body.categoryId === "string" &&
      body.categoryId.trim()
        ? body.categoryId.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "اسم المنتج مطلوب",
        },
        { status: 400 }
      );
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      Number.isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "سعر المنتج غير صالح",
        },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: {
        ownerId: auth.userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "لا يوجد متجر مرتبط بهذا الحساب",
        },
        { status: 404 }
      );
    }

    if (store.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "المتجر غير نشط",
        },
        { status: 403 }
      );
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          storeId: store.id,
        },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            message: "التصنيف غير موجود في متجرك",
          },
          { status: 400 }
        );
      }
    }

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          storeId: store.id,
          name,
        },
      });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "يوجد منتج بهذا الاسم بالفعل",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId,
        name,
        description: description || null,
        price: Number(price),
        availability,
        status,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء المنتج بنجاح",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create store product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء المنتج",
      },
      { status: 500 }
    );
  }
}
