/**
 * CSRF Protection Middleware — Dalalti
 *
 * يتحقق من أن جميع الطلبات التي تغير الحالة (POST, PATCH, PUT, DELETE)
 * قادمة من نفس الأصل (Same-Origin).
 *
 * يستخدم Defense in Depth:
 * 1. SameSite=Strict للـ session cookie (في auth)
 * 2. Origin/Referer validation هنا (للطلبات state-changing)
 *
 * لا يتحقق من:
 * - GET, HEAD, OPTIONS (safe methods)
 * - /api/auth/login (لا يوجد cookie بعد)
 * - /api/auth/logout (يمكن أن يكون من أي مصدر)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
];

function getAllowedOrigin(): string | null {
  return process.env.NEXT_PUBLIC_APP_URL || null;
}

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATHS.some((path) => pathname === path);
}

function verifySameOrigin(request: NextRequest): boolean {
  const allowedOrigin = getAllowedOrigin();
  if (!allowedOrigin) {
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

  // لا Origin ولا Referer
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  // لا نتحقق من safe methods
  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  // لا نتحقق من المسارات المعفاة
  if (isExemptPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // التحقق من Same-Origin
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "طلب غير مصرح به. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
      },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
