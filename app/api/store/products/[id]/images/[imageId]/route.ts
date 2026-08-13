import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

async function getOwnedImage(
  userId: string,
  productId: string,
  imageId: string
) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId: userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!store) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "لا يوجد متجر مرتبط بهذا الحساب",
        },
        { status: 404 }
      ),
    };
  }

  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
      product: {
        storeId: store.id,
      },
    },
  });

  if (!image) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "الصورة غير موجودة في متجرك",
        },
        { status: 404 }
      ),
    };
  }

  return {
    store,
    image,
  };
}

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
    const { id, imageId } = await context.params;

    const result = await getOwnedImage(
      auth.userId,
      id,
      imageId
    );

    if (result.error) {
      return result.error;
    }

    if (result.store.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "المتجر غير نشط",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const data: {
      imageUrl?: string;
      sortOrder?: number;
    } = {};

    if (body.imageUrl !== undefined) {
      if (
        typeof body.imageUrl !== "string" ||
        !body.imageUrl.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "رابط الصورة غير صالح",
          },
          { status: 400 }
        );
      }

      data.imageUrl = body.imageUrl.trim();
    }

    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder);

      if (
        !Number.isInteger(sortOrder) ||
        sortOrder < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "ترتيب الصورة غير صالح",
          },
          { status: 400 }
        );
      }

      data.sortOrder = sortOrder;
    }

    if (body.isPrimary === true) {
      const image = await prisma.$transaction(
        async (tx) => {
          await tx.productImage.updateMany({
            where: {
              productId: id,
              isPrimary: true,
              NOT: {
                id: imageId,
              },
            },
            data: {
              isPrimary: false,
            },
          });

          return tx.productImage.update({
            where: {
              id: imageId,
            },
            data: {
              ...data,
              isPrimary: true,
            },
          });
        }
      );

      return NextResponse.json({
        success: true,
        message: "تم تحديث صورة المنتج بنجاح",
        image,
      });
    }

    if (body.isPrimary === false) {
      data.imageUrl ??= result.image.imageUrl;

      const image = await prisma.productImage.update({
        where: {
          id: imageId,
        },
        data: {
          ...data,
          isPrimary: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث صورة المنتج بنجاح",
        image,
      });
    }

    const image = await prisma.productImage.update({
      where: {
        id: imageId,
      },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث صورة المنتج بنجاح",
      image,
    });
  } catch (error) {
    console.error("Update product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث صورة المنتج",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { id, imageId } = await context.params;

    const result = await getOwnedImage(
      auth.userId,
      id,
      imageId
    );

    if (result.error) {
      return result.error;
    }

    if (result.store.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "المتجر غير نشط",
        },
        { status: 403 }
      );
    }

    await prisma.productImage.delete({
      where: {
        id: imageId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف صورة المنتج بنجاح",
    });
  } catch (error) {
    console.error("Delete product image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حذف صورة المنتج",
      },
      { status: 500 }
    );
  }
}
