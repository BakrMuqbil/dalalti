import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getStoreProduct(
  authUserId: string,
  productId: string
) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId: authUserId,
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

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: {
      id: true,
      storeId: true,
    },
  });

  if (!product) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "المنتج غير موجود في متجرك",
        },
        { status: 404 }
      ),
    };
  }

  return {
    store,
    product,
  };
}

/**
 * GET
 * جلب صور منتج معين
 */
export async function GET(
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

    const result = await getStoreProduct(
      auth.userId,
      id
    );

    if (result.error) {
      return result.error;
    }

    const images = await prisma.productImage.findMany({
      where: {
        productId: result.product.id,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error(
      "Get product images error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل صور المنتج",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * إضافة صورة جديدة للمنتج
 */
export async function POST(
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

    const result = await getStoreProduct(
      auth.userId,
      id
    );

    if (result.error) {
      return result.error;
    }

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "رابط الصورة مطلوب",
        },
        { status: 400 }
      );
    }

    const sortOrder =
      body.sortOrder === undefined
        ? 0
        : Number(body.sortOrder);

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

    const isPrimary =
      body.isPrimary === true;

    /*
     * إذا كانت الصورة الجديدة رئيسية،
     * نجعل جميع الصور الأخرى غير رئيسية.
     */
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: {
          productId: result.product.id,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    /*
     * إذا لم توجد أي صورة للمنتج،
     * نجعل أول صورة رئيسية تلقائيًا.
     */
    const imageCount =
      await prisma.productImage.count({
        where: {
          productId: result.product.id,
        },
      });

    const finalIsPrimary =
      imageCount === 0 || isPrimary;

    const image =
      await prisma.productImage.create({
        data: {
          productId: result.product.id,
          imageUrl,
          sortOrder,
          isPrimary: finalIsPrimary,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة الصورة بنجاح",
        image,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create product image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إضافة الصورة",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * تعديل ترتيب الصورة أو جعلها الصورة الرئيسية
 */
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

    const result = await getStoreProduct(
      auth.userId,
      id
    );

    if (result.error) {
      return result.error;
    }

    const imageId =
      typeof body.imageId === "string"
        ? body.imageId.trim()
        : "";

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف الصورة مطلوب",
        },
        { status: 400 }
      );
    }

    const image =
      await prisma.productImage.findFirst({
        where: {
          id: imageId,
          productId: result.product.id,
        },
      });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "الصورة غير موجودة في هذا المنتج",
        },
        { status: 404 }
      );
    }

    const updateData: {
      sortOrder?: number;
      isPrimary?: boolean;
    } = {};

    if (body.sortOrder !== undefined) {
      const sortOrder = Number(
        body.sortOrder
      );

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

      updateData.sortOrder = sortOrder;
    }

    if (body.isPrimary !== undefined) {
      if (typeof body.isPrimary !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "قيمة الصورة الرئيسية غير صالحة",
          },
          { status: 400 }
        );
      }

      updateData.isPrimary =
        body.isPrimary;
    }

    /*
     * لا نسمح بوجود أكثر من صورة رئيسية.
     */
    if (updateData.isPrimary === true) {
      await prisma.productImage.updateMany({
        where: {
          productId: result.product.id,
          id: {
            not: image.id,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const updatedImage =
      await prisma.productImage.update({
        where: {
          id: image.id,
        },
        data: updateData,
      });

    return NextResponse.json({
      success: true,
      message: "تم تحديث الصورة بنجاح",
      image: updatedImage,
    });
  } catch (error) {
    console.error(
      "Update product image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث الصورة",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * حذف صورة
 */
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
    const { id } = await context.params;
    const body = await request.json();

    const result = await getStoreProduct(
      auth.userId,
      id
    );

    if (result.error) {
      return result.error;
    }

    const imageId =
      typeof body.imageId === "string"
        ? body.imageId.trim()
        : "";

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف الصورة مطلوب",
        },
        { status: 400 }
      );
    }

    const image =
      await prisma.productImage.findFirst({
        where: {
          id: imageId,
          productId: result.product.id,
        },
      });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "الصورة غير موجودة في هذا المنتج",
        },
        { status: 404 }
      );
    }

    await prisma.productImage.delete({
      where: {
        id: image.id,
      },
    });

    /*
     * إذا حذفنا الصورة الرئيسية،
     * نختار أول صورة متبقية كرئيسية.
     */
    if (image.isPrimary) {
      const nextImage =
        await prisma.productImage.findFirst({
          where: {
            productId: result.product.id,
          },
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        });

      if (nextImage) {
        await prisma.productImage.update({
          where: {
            id: nextImage.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف الصورة بنجاح",
    });
  } catch (error) {
    console.error(
      "Delete product image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حذف الصورة",
      },
      { status: 500 }
    );
  }
}