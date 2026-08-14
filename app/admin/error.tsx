'use client';

import { useEffect } from 'react';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error boundary caught:', error);
  }, [error]);

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 text-4xl">
          ⚠️
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          حدث خطأ غير متوقع
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          واجهنا مشكلة في تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة إلى لوحة الإدارة.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-soft/60">
            {error.digest}
          </p>
        )}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-deep"
          >
            إعادة المحاولة
          </button>
          <a
            href="/admin/dashboard"
            className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-bold text-ink transition hover:bg-background"
          >
            لوحة الإدارة
          </a>
        </div>
      </div>
    </main>
  );
}
