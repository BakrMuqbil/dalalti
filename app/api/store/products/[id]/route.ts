import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { Prisma } from "@/app/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
    const { id } = await context.params;
    const body = await request.json();

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

    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "المنتج غير موجود",
        },
        { status: 404 }
      );
    }

    const data: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "اسم المنتج غير صالح",
          },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "سعر المنتج غير صالح",
          },
          { status: 400 }
        );
      }

      data.price = price;
    }

    if (body.categoryId !== undefined) {
      const categoryId =
        typeof body.categoryId === "string" &&
        body.categoryId.trim()
          ? body.categoryId.trim()
          : null;

      if (categoryId) {
        const category =
          await prisma.category.findFirst({
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

      if (categoryId) {
        data.category = {
          connect: {
            id: categoryId,
          },
        };
      } else {
        data.category = {
          disconnect: true,
        };
      }
    }

    if (body.availability !== undefined) {
      if (
        body.availability !== "AVAILABLE" &&
        body.availability !== "UNAVAILABLE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "حالة التوفر غير صالحة",
          },
          { status: 400 }
        );
      }

      data.availability = body.availability;
    }

    if (body.status !== undefined) {
      if (
        body.status !== "ACTIVE" &&
        body.status !== "INACTIVE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "حالة المنتج غير صالحة",
          },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (
      typeof body.name === "string" &&
      body.name.trim() &&
      body.name.trim() !== product.name
    ) {
      const duplicate =
        await prisma.product.findFirst({
          where: {
            storeId: store.id,
            name: body.name.trim(),
            NOT: {
              id: product.id,
            },
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: "يوجد منتج بهذا الاسم بالفعل",
          },
          { status: 409 }
        );
      }
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id: product.id,
        },
        data,
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });

    return NextResponse.json({
      success: true,
      message: "تم تحديث المنتج بنجاح",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update store product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث المنتج",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
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
    const { id } = await context.params;

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

    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "المنتج غير موجود",
        },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: {
        id: product.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج بنجاح",
    });
  } catch (error) {
    console.error("Delete store product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حذف المنتج",
      },
      { status: 500 }
    );
  }
}
