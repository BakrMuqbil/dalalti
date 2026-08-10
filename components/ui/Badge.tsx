import { HTMLAttributes } from "react";

type BadgeTone = "success" | "danger" | "warning" | "neutral" | "brand";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  neutral: "bg-line/60 text-ink-soft",
  brand: "bg-gold-soft/40 text-brand-deep",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneStyles[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

/** تحويل حالة توفر المنتج (AVAILABLE/UNAVAILABLE) إلى Badge جاهزة */
export function AvailabilityBadge({
  availability,
}: {
  availability: "AVAILABLE" | "UNAVAILABLE";
}) {
  return (
    <Badge tone={availability === "AVAILABLE" ? "success" : "danger"}>
      {availability === "AVAILABLE" ? "متوفر" : "غير متوفر"}
    </Badge>
  );
}

/** تحويل حالة نشاط المنتج (ACTIVE/INACTIVE) إلى Badge جاهزة */
export function StatusBadge({
  status,
}: {
  status: "ACTIVE" | "INACTIVE";
}) {
  return (
    <Badge tone={status === "ACTIVE" ? "brand" : "neutral"}>
      {status === "ACTIVE" ? "نشط" : "غير نشط"}
    </Badge>
  );
}
