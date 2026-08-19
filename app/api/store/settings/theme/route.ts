import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { handleApiError } from "@/lib/api-response";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { updateStoreThemeSchema } from "@/lib/validation/store";

const DEFAULT_THEME = {
  primaryColor: "#7A5C3E",
  secondaryColor: "#5E4530",
  accentColor: "#B8862E",
  backgroundColor: "#FAF7F2",
  textColor: "#2B2420",
} as const;

async function getStoreId() {
  const auth = await requireStoreOwner();
  if (!auth) return null;

  const store = await prisma.store.findUnique({
    where: { ownerId: auth.userId },
    select: { id: true },
  });

  return store?.id ?? null;
}

export async function GET() {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeRead);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 401 },
      );
    }

    const theme = await prisma.storeTheme.upsert({
      where: { storeId },
      create: { storeId, ...DEFAULT_THEME },
      update: {},
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.storeWrite);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "لا يوجد متجر مرتبط بهذا الحساب" },
        { status: 401 },
      );
    }

    const parsed = updateStoreThemeSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "بيانات السمة غير صالحة",
        },
        { status: 400 },
      );
    }

    const theme = await prisma.storeTheme.upsert({
      where: { storeId },
      create: { storeId, ...parsed.data },
      update: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ مظهر المتجر بنجاح",
      theme,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
