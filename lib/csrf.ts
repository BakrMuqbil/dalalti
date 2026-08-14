/**
 * CSRF Protection — Dalalti
 *
 * تستخدم آلية Defense in Depth:
 * 1. SameSite=Strict للـ session cookie (يمنع إرسال الكوكي cross-site).
 * 2. Origin/Referer validation للـ state-changing requests.
 * 3. Double-Submit Cookie Pattern (CSRF token) للاستخدام المستقبلي.
 *
 * لا تضيف dependencies خارجية.
 */

import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { errorResponse } from "./api-response";

const CSRF_COOKIE_NAME = "dalalti_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

/* ============================================================
   SameSite Hardening
   ============================================================ */

/**
 * إعدادات Cookie المُعززة لمنع CSRF.
 * تستخدم SameSite=Strict في جميع البيئات.
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/" as const,
};

/* ============================================================
   Origin / Referer Validation
   ============================================================ */

/**
 * يستخرج الـ Origin المسموح من متغيرات البيئة.
 * يستخدم في التحقق من Origin/Referer.
 */
function getAllowedOrigin(): string | null {
  return process.env.NEXT_PUBLIC_APP_URL || null;
}

/**
 * يتحقق من أن الطلب قادم من نفس الأصل (Same-Site).
 *
 * يتحقق من:
 * 1. Origin header (إذا موجود)
 * 2. Referer header (إذا لم يكن Origin موجوداً)
 *
 * يُستخدم في state-changing requests (POST, PATCH, PUT, DELETE).
 */
export function verifySameOrigin(request: Request): boolean {
  const allowedOrigin = getAllowedOrigin();
  if (!allowedOrigin) {
    // إذا لم يُحدد ORIGIN، نسمح بالطلب (development)
    return true;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin === allowedOrigin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return refererOrigin === allowedOrigin;
    } catch {
      return false;
    }
  }

  // لا Origin ولا Referer — قد يكون طلباً من نفس الموقع (Same-Origin)
  // أو من تطبيق Native. في الإنتاج، نرفض.
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return true;
}

/**
 * Helper جاهز: يتحقق من Same-Origin ويعيد 403 إذا فشل.
 */
export function csrfForbidden(): NextResponse {
  return errorResponse(
    "طلب غير مصرح به. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
    403,
  );
}

/* ============================================================
   Double-Submit Cookie Pattern (للاستخدام المستقبلي)
   ============================================================ */

/** ينشئ CSRF token عشوائي آمن. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * يضيف CSRF token إلى الاستجابة (cookie + body).
 * يُستدعى بعد نجاح تسجيل الدخول.
 */
export function setCsrfCookie(response: NextResponse): string {
  const token = generateCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // يجب أن يكون قابلاً للقراءة من JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 أيام
    path: "/",
  });
  return token;
}

/**
 * يتحقق من صحة CSRF token (Double-Submit Cookie).
 * يقارن الـ cookie مع الـ header.
 *
 * يُستخدم في API routes للـ state-changing requests.
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // مقارنة آمنة من هجمات Timing Attack
  try {
    const cookieBuf = Buffer.from(cookieToken, "utf-8");
    const headerBuf = Buffer.from(headerToken, "utf-8");

    if (cookieBuf.length !== headerBuf.length) {
      return false;
    }

    return timingSafeEqual(cookieBuf, headerBuf);
  } catch {
    return false;
  }
}
