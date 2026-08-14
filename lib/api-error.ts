/**
 * Unified API Error Handling — Dalalti
 *
 * فئات أخطاء موحدة مع status codes مرتبطة.
 * تُستخدم في API routes لتوحيد معالجة الأخطاء.
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/** خطأ تحقق من البيانات — 400 */
export class ValidationError extends ApiError {
  constructor(message = "بيانات غير صالحة") {
    super(message, 400);
  }
}

/** خطأ مصادقة — 401 */
export class AuthenticationError extends ApiError {
  constructor(message = "غير مصرح لك بتنفيذ هذا الإجراء") {
    super(message, 401);
  }
}

/** خطأ صلاحية — 403 */
export class AuthorizationError extends ApiError {
  constructor(message = "غير مسموح لك بالوصول") {
    super(message, 403);
  }
}

/** خطأ عدم وجود — 404 */
export class NotFoundError extends ApiError {
  constructor(message = "المورد غير موجود") {
    super(message, 404);
  }
}

/** خطأ تعارض — 409 */
export class ConflictError extends ApiError {
  constructor(message = "يوجد تعارض في البيانات") {
    super(message, 409);
  }
}

/** خطأ Rate Limit — 429 */
export class RateLimitError extends ApiError {
  public readonly retryAfter: number;

  constructor(message = "عدد الطلبات كبير", retryAfter = 60) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/** خطأ خادم داخلي — 500 */
export class InternalError extends ApiError {
  constructor(message = "حدث خطأ داخلي") {
    super(message, 500, false);
  }
}
