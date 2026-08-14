/**
 * Rate Limiting Utility — In-Memory (قابل لاستبداله بـ Redis/Upstash لاحقاً)
 *
 * يستخدم Map في الذاكرة مع تنظيف تلقائي دوري لمنع تسرب الذاكرة.
 * يدعم namespace + key فريد لكل endpoint/مستخدم.
 */

export interface RateLimitConfig {
  /** الحد الأقصى للطلبات */
  limit: number;
  /** نافذة الوقت بالمللي ثانية */
  windowMs: number;
  /** بادئة للمفتاح (مثلاً: "login", "admin", "store") */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** هل الطلب مسموح به؟ */
  allowed: boolean;
  /** عدد الطلبات المتبقية */
  remaining: number;
  /** وقت إعادة الضبط (timestamp بالمللي ثانية) */
  resetAt: number;
  /** عدد الثواني المتبقية لإعادة المحاولة (فقط عند الرفض) */
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * مستخرج IP من headers الطلب.
 * يدعم x-forwarded-for و x-real-ip.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for قد يحتوي على عدة IPs: "client, proxy1, proxy2"
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * ينشئ مفتاح rate limit موحد.
 */
export function buildRateLimitKey(
  config: RateLimitConfig,
  identifier: string
): string {
  const prefix = config.keyPrefix ?? "rl";
  return `${prefix}:${identifier}`;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 60_000) {
    // تنظيف دوري للإدخالات المنتهية لمنع تسرب الذاكرة
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    // تأكد من عدم إبقاء الـ timer نشطاً إذا انتهى الـ process
    // (مهم في بيئات الاختبار)
    if (typeof process !== "undefined") {
      process.on("exit", () => this.destroy());
    }
  }

  /**
   يتحقق من الحد ويزيد العداد. يجب استدعاؤه مرة واحدة لكل طلب.
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      // نافذة جديدة
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: newEntry.resetAt,
      };
    }

    // نفس النافذة
    if (entry.count >= config.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: config.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * يزيل الإدخالات المنتهية من الذاكرة.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * يوقف المؤقت (للاختبارات فقط).
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  /**
   * يعيد عدد الإدخالات الحالية (للاختبارات/المراقبة).
   */
  size(): number {
    return this.store.size;
  }
}

// Singleton — يُشارك بين كل الطلبات في نفس الـ process
export const rateLimiter = new RateLimiter();

/**
 * Helper سريع: يتحقق من الحد ويعيد نتيجة جاهزة.
 * يستخدم في API routes مباشرة.
 */
export function rateLimitCheck(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = buildRateLimitKey(config, identifier);
  return rateLimiter.check(key, config);
}

/* ============================================================
   Helpers جاهزة للاستخدام المباشر في API Routes
   ============================================================ */

import { NextResponse } from "next/server";

/** إعدادات جاهزة للاستخدام */
export const rateLimitPresets = {
  /** تسجيل الدخول: 5 محاولات / 15 دقيقة */
  login: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: "login" as const },
  /** Admin APIs — قراءة: 100 طلب / دقيقة */
  adminRead: { limit: 100, windowMs: 60 * 1000, keyPrefix: "admin" as const },
  /** Admin APIs — كتابة: 50 طلب / دقيقة */
  adminWrite: { limit: 50, windowMs: 60 * 1000, keyPrefix: "admin" as const },
  /** Store APIs — قراءة: 120 طلب / دقيقة */
  storeRead: { limit: 120, windowMs: 60 * 1000, keyPrefix: "store" as const },
  /** Store APIs — كتابة: 60 طلب / دقيقة */
  storeWrite: { limit: 60, windowMs: 60 * 1000, keyPrefix: "store" as const },
  /** رفع الملفات: 20 طلب / دقيقة */
  upload: { limit: 20, windowMs: 60 * 1000, keyPrefix: "upload" as const },
};

/**
 * يتحقق من Rate Limit ويعيد NextResponse برسالة 429 إذا تجاوز الحد.
 * يُستخدم في بداية كل API route.
 */
export function applyRateLimit(
  headers: Headers,
  config: RateLimitConfig
): NextResponse | null {
  const clientIp = getClientIp(headers);
  const result = rateLimitCheck(clientIp, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "عدد الطلبات كبير. يرجى المحاولة لاحقاً.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter ?? 60),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
