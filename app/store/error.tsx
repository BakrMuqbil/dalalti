"use client";
import { useEffect } from "react";
export default function StoreErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store error boundary caught:", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      {" "}
      <div className="mb-6 text-6xl">⚠️</div>{" "}
      <h1 className="font-display text-2xl font-bold text-ink">
        {" "}
        حدث خطأ غير متوقع{" "}
      </h1>{" "}
      <p className="mt-3 text-sm text-ink-soft">
        {" "}
        واجهنا مشكلة في تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى.{" "}
      </p>{" "}
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-soft/60">
          {" "}
          {error.digest}{" "}
        </p>
      )}{" "}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-deep"
      >
        {" "}
        إعادة المحاولة{" "}
      </button>{" "}
    </div>
  );
}
