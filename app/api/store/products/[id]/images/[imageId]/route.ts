import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { updateProductImageSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

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
    where: { ownerId: userId },
    select: { id: true, status: true },
  });

  if (!store) {
    return {
      error: NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      ),
    };
  }

  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
      product: { storeId: store.id },
    },
  });

  if (!image) {
    return {
      error: NextResponse.json(
        { success: false, message: "الصورة غير موجودة في متجرك" },
        { status: 404 }
      ),
    };
  }

  return { store, image };
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
    const { id, imageId } = await context.params;

    const result = await getOwnedImage(auth.userId, id, imageId);

    if (result.error) {
      return result.error;
    }

    if (result.store.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "المتجر غير نشط" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = updateProductImageSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات الصورة غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "لا توجد بيانات لتحديثها" },
        { status: 400 }
      );
    }

    if (data.isPrimary === true) {
      const image = await prisma.$transaction(async (tx) => {
        await tx.productImage.updateMany({
          where: {
            productId: id,
            isPrimary: true,
            NOT: { id: imageId },
          },
          data: { isPrimary: false },
        });

        return tx.productImage.update({
          where: { id: imageId },
          data: { ...data, isPrimary: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث صورة المنتج بنجاح",
        image,
      });
    }

    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث صورة المنتج بنجاح",
      image: updatedImage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
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
    const { id, imageId } = await context.params;

    const result = await getOwnedImage(auth.userId, id, imageId);

    if (result.error) {
      return result.error;
    }

    if (result.store.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "المتجر غير نشط" },
        { status: 403 }
      );
    }

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    if (result.image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
      });

      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف صورة المنتج بنجاح",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
