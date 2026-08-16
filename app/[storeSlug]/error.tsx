"use client";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AlertTriangleIcon } from "@/components/icons";
export default function StoreErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Error:", error);
  }, [error]);
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      dir="rtl"
    >
      {" "}
      <div className="w-full max-w-md">
        {" "}
        <EmptyState
          icon={<AlertTriangleIcon className="h-12 w-12 text-danger" />}
          title="حدث خطأ غير متوقع"
          description="نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية."
        >
          {" "}
          <div className="flex flex-col gap-3 sm:flex-row">
            {" "}
            <Button onClick={reset} variant="primary">
              {" "}
              إعادة المحاولة{" "}
            </Button>{" "}
          </div>{" "}
        </EmptyState>{" "}
      </div>{" "}
    </div>
  );
}
