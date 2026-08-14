import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { updateProductSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";


type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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
    const { id } = await context.params;
    const rawBody = await request.json();
    const parsed = updateProductSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const body = parsed.data;

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

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      data.name = body.name;
    }

    if (body.description !== undefined) {
      data.description = body.description;
    }

    if (body.price !== undefined) {
      data.price = body.price;
    }

    if (body.categoryId !== undefined) {
      if (body.categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: body.categoryId, storeId: store.id },
        });
        if (!category) {
          return NextResponse.json(
            { success: false, message: "التصنيف غير موجود في متجرك" },
            { status: 400 }
          );
        }
        data.category = { connect: { id: body.categoryId } };
      } else {
        data.category = { disconnect: true };
      }
    }

    if (body.availability !== undefined) {
      data.availability = body.availability;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.name && body.name !== product.name) {
      const duplicate = await prisma.product.findFirst({
        where: { storeId: store.id, name: body.name, NOT: { id: product.id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "يوجد منتج بهذا الاسم بالفعل" },
          { status: 409 }
        );
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data,
      include: { category: true, images: true, variants: true },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث المنتج بنجاح",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update store product error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث المنتج" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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
    const { id } = await context.params;

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

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id: product.id } });

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج بنجاح",
    });
  } catch (error) {
    console.error("Delete store product error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء حذف المنتج" },
      { status: 500 }
    );
  }
}
