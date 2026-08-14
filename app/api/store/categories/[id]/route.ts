import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { updateCategorySchema } from "@/lib/validation";
import { headers } from "next/headers";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getStore(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
}

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
    const parsed = updateCategorySchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات التصنيف غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, parentId, imageUrl } = parsed.data;

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

    const category = await prisma.category.findFirst({
      where: { id, storeId: store.id },
      select: { id: true, name: true, parentId: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "التصنيف غير موجود في متجرك" },
        { status: 404 }
      );
    }

    if (parentId !== undefined) {
      if (parentId === id) {
        return NextResponse.json(
          { success: false, message: "لا يمكن جعل التصنيف أبًا لنفسه" },
          { status: 400 }
        );
      }

      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: { id: parentId, storeId: store.id },
          select: { id: true },
        });
        if (!parent) {
          return NextResponse.json(
            { success: false, message: "التصنيف الأب غير موجود في متجرك" },
            { status: 400 }
          );
        }
      }
    }

    if (name && name !== category.name) {
      const duplicate = await prisma.category.findFirst({
        where: { storeId: store.id, name, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "يوجد تصنيف بهذا الاسم بالفعل" },
          { status: 409 }
        );
      }
    }

    const data: { name?: string; parentId?: string | null; imageUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (parentId !== undefined) data.parentId = parentId;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "لا توجد بيانات لتحديثها" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
      include: { children: true, _count: { select: { products: true, children: true } } },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث التصنيف بنجاح",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update store category error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث التصنيف" },
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

    const category = await prisma.category.findFirst({
      where: { id, storeId: store.id },
      select: { id: true, name: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "التصنيف غير موجود في متجرك" },
        { status: 404 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "تم حذف التصنيف بنجاح",
    });
  } catch (error) {
    console.error("Delete store category error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء حذف التصنيف" },
      { status: 500 }
    );
  }
}
