"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "STORE_OWNER";
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!phone.trim() || !password) {
      setError("يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.message || "بيانات الدخول غير صحيحة");
      }

      if (data.user.role === "ADMIN") {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }

      if (data.user.role === "STORE_OWNER") {
        router.replace("/store/dashboard");
        router.refresh();
        return;
      }

      throw new Error("صلاحية الحساب غير معروفة");
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-10">
      {/* خلفية زخرفية هادئة — نسيج نقاط دقيق يلمّح لطابع السوق دون أن يشتت */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #B8862E 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* توهج ذهبي خافت أعلى يمين الشاشة */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        {/* العلامة */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-brand shadow-[0_8px_30px_rgba(184,134,46,0.35)]">
            <span className="font-display text-2xl font-bold text-white">
              د
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-background">
            دلالتي
          </h1>

          <p className="mt-2 text-sm text-background/55">
            متجرك الخاص، بثقة زبائنك
          </p>
        </div>

        {/* بطاقة الفورم */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* خط ذهبي رفيع أعلى البطاقة */}
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl bg-gradient-to-l from-transparent via-gold to-transparent" />

          <div className="p-7 sm:p-9">
            <div className="mb-7">
              <h2 className="font-display text-xl font-semibold text-ink">
                مرحبًا بعودتك
              </h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                أدخلي بيانات حسابك للمتابعة إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                htmlFor="phone"
                label="رقم الهاتف"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7XX XXX XXX"
                disabled={loading}
                className="text-left"
              />

              <div className="relative">
                <Input
                  htmlFor="password"
                  label="كلمة المرور"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="pl-5 text-left"
                />
<button
  type="button"
  dir="rtl"
  onClick={() => setShowPassword((show) => !show)}
  disabled={loading}
  tabIndex={-1}
  className="absolute bottom-3 right-3 text-xs font-medium text-ink-soft transition hover:text-brand disabled:pointer-events-none after:content-['|'] after:mr-1 after:text-ink-soft/30"
>
  {showPassword ? "إخفاء" : "إظهار"}
</button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
                >
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full shadow-[0_4px_16px_rgba(122,92,62,0.3)]"
                size="lg"
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-soft/70">دلالتي</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">
              منصة إدارة المتاجر والاشتراكات لدلالات عدن.
              <br />
              لأي مشكلة في الدخول تواصلي مع إدارة المنصة.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-background/40">
          © {new Date().getFullYear()} دلالتي — جميع الحقوق محفوظة
        </p>
      </div>
    </main>
  );
}
