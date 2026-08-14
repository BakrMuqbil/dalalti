/**
 * Unified API Response Helpers — Dalalti
 *
 * دوال مساعدة لتوحيد استجابات API.
 * تحافظ على Response Shape المتوافق مع النظام الحالي.
 */

import { NextResponse } from "next/server";
import { ApiError, RateLimitError } from "./api-error";

interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

interface ErrorResponse {
  success: false;
  message: string;
}

/** استجابة ناجحة */
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200,
): NextResponse {
  const body: SuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

/** استجابة ناجحة ببيانات مسطحة (للتوافق مع الـ routes الحالية) */
export function successJson(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json({ success: true, ...body }, { status });
}

/** استجابة خطأ */
export function errorResponse(
  message: string,
  status = 500,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status, headers },
  );
}

/**
 * معالج أخطاء موحد لـ API routes.
 *
 * يتحقق من نوع الخطأ ويعيد الاستجابة المناسبة.
 * لا يكشف stack trace أو تفاصيل داخلية للمستخدم.
 */
export function handleApiError(error: unknown): NextResponse {
  // ApiError معروف
  if (error instanceof ApiError) {
    const headers: Record<string, string> = {};
    if (error instanceof RateLimitError) {
      headers["Retry-After"] = String(error.retryAfter);
    }
    return errorResponse(error.message, error.statusCode, headers);
  }

  // Prisma errors
  if (error instanceof Error) {
    // P2002: Unique constraint violation
    if (error.message.includes("P2002")) {
      return errorResponse("يوجد تعارض في البيانات", 409);
    }
    // P2025: Record not found
    if (error.message.includes("P2025")) {
      return errorResponse("المورد غير موجود", 404);
    }
    // P2003: Foreign key constraint failed
    if (error.message.includes("P2003")) {
      return errorResponse("البيانات المرتبطة غير موجودة", 400);
    }
  }

  // خطأ غير متوقع — لا نكشف التفاصيل
  console.error("[API Error]", error);
  return errorResponse("حدث خطأ أثناء معالجة الطلب", 500);
}

/**
 * يقرأ JSON من الطلب بأمان.
 * يعيد ValidationError إذا كان JSON غير صالح.
 */
export async function safeJsonParse(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError("بيانات JSON غير صالحة", 400);
  }
}

/**
 * يستخرج رسالة الخطأ الأولى من Zod error.
 */
export function getZodErrorMessage(error: { issues?: Array<{ message: string }> }): string {
  return error.issues?.[0]?.message || "بيانات غير صالحة";
}
