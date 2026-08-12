import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";

async function getStore(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, status: true },
  });
}

export async function GET(request: Request) {
  const auth = await requireStoreOwner();
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const store = await getStore(auth.userId);
    if (!store) return NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q")?.trim() || "";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

    const customers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("Get store customers error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تحميل العملاء" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireStoreOwner();
  if (!auth) return NextResponse.json({ success: false, message: "غير مصرح لك بتنفيذ هذا الإجراء" }, { status: 401 });

  try {
    const store = await getStore(auth.userId);
    if (!store) return NextResponse.json({ success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" }, { status: 404 });
    if (store.status !== "ACTIVE") return NextResponse.json({ success: false, message: "المتجر غير نشط" }, { status: 403 });

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    if (!name || !phone) return NextResponse.json({ success: false, message: "اسم العميل ورقم الهاتف مطلوبان" }, { status: 400 });

    const customer = await prisma.customer.create({ data: { storeId: store.id, name, phone, address, notes } });
    return NextResponse.json({ success: true, message: "تم إنشاء العميل بنجاح", customer }, { status: 201 });
  } catch (error) {
  console.error("========================================");
  console.error("CREATE CUSTOMER ERROR");
  console.error(error);
  console.error("========================================");

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء العميل",
    },
    { status: 500 }
  );
}
}
