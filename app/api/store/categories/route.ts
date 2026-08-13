import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { createCategorySchema } from "@/lib/validation";

async function getStoreId(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
}

export async function GET() {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await getStoreId(auth.userId);

    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      include: {
        children: { orderBy: { name: "asc" } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Get store categories error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحميل التصنيفات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = createCategorySchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات التصنيف غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, parentId } = parsed.data;

    const store = await getStoreId(auth.userId);

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

    const existingCategory = await prisma.category.findFirst({
      where: { storeId: store.id, name },
      select: { id: true },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "يوجد تصنيف بهذا الاسم بالفعل" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { storeId: store.id, parentId, name },
      include: { children: true, _count: { select: { products: true, children: true } } },
    });

    return NextResponse.json(
      { success: true, message: "تم إنشاء التصنيف بنجاح", category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create store category error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء التصنيف" },
      { status: 500 }
    );
  }
}
