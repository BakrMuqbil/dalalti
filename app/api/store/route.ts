import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { updateStoreSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireStoreOwner();
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error("Get store error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب بيانات المتجر" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStoreOwner();
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" },
      { status: 401 }
    );
  }

  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId },
      select: { id: true, slug: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 404 }
      );
    }

    const rawBody = await request.json();
    const parsed = updateStoreSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات المتجر غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const data = parsed.data;

    if (data.slug && data.slug !== store.slug) {
      const duplicate = await prisma.store.findFirst({
        where: { slug: data.slug, NOT: { id: store.id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "رابط المتجر مستخدم بالفعل" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المتجر",
      store: updated,
    });
  } catch (error) {
    console.error("Update store error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث المتجر" },
      { status: 500 }
    );
  }
}
