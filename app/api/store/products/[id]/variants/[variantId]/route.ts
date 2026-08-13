import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { updateVariantSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
    variantId: string;
  }>;
};

async function getOwnedVariant(
  userId: string,
  productId: string,
  variantId: string
) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });

  if (!store || store.status !== "ACTIVE") return null;

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
      product: { storeId: store.id },
    },
  });

  return variant;
}

export async function PATCH(
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
    const { id, variantId } = await context.params;
    const rawBody = await request.json();
    const parsed = updateVariantSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات المتغير غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const body = parsed.data;

    const variant = await getOwnedVariant(auth.userId, id, variantId);

    if (!variant) {
      return NextResponse.json(
        { success: false, message: "المتغير غير موجود" },
        { status: 404 }
      );
    }

    const data: {
      color?: string | null;
      size?: string | null;
      price?: number | null;
      availability?: "AVAILABLE" | "UNAVAILABLE";
    } = {};

    if (body.color !== undefined) data.color = body.color;
    if (body.size !== undefined) data.size = body.size;
    if (body.price !== undefined) data.price = body.price;
    if (body.availability !== undefined) data.availability = body.availability;

    const nextColor = data.color !== undefined ? data.color : variant.color;
    const nextSize = data.size !== undefined ? data.size : variant.size;

    if (!nextColor && !nextSize) {
      return NextResponse.json(
        { success: false, message: "يجب تحديد اللون أو المقاس على الأقل" },
        { status: 400 }
      );
    }

    if (data.color !== undefined || data.size !== undefined) {
      const duplicate = await prisma.productVariant.findFirst({
        where: {
          productId: id,
          color: nextColor,
          size: nextSize,
          NOT: { id: variantId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "هذا المتغير موجود بالفعل" },
          { status: 409 }
        );
      }
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث المتغير بنجاح",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Update product variant error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث المتغير" },
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
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const { id, variantId } = await context.params;

    const variant = await getOwnedVariant(auth.userId, id, variantId);

    if (!variant) {
      return NextResponse.json(
        { success: false, message: "المتغير غير موجود" },
        { status: 404 }
      );
    }

    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف المتغير بنجاح",
    });
  } catch (error) {
    console.error("Delete product variant error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء حذف المتغير" },
      { status: 500 }
    );
  }
}
