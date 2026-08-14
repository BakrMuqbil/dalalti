import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createAuthToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { headers } from "next/headers";
import { rateLimitCheck, getClientIp } from "@/lib/rate-limit";
import { SECURE_COOKIE_OPTIONS, setCsrfCookie } from "@/lib/csrf";

const LOGIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  keyPrefix: "login" as const,
};

export async function POST(request: Request) {
  try {
    // Rate Limiting: حسب IP
    const reqHeaders = await headers();
    const clientIp = getClientIp(reqHeaders);
    const rateLimit = rateLimitCheck(clientIp, LOGIN_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "عدد محاولات تسجيل الدخول كبير. يرجى المحاولة لاحقاً.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter ?? 900),
          },
        }
      );
    }

    const rawBody = await request.json();
    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "بيانات غير صالحة";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { phone, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const token = await createAuthToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set("dalalti_session", token, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7,
    });

    // إضافة CSRF token للاستخدام المستقبلي
    const csrfToken = setCsrfCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
