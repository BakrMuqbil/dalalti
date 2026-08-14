import Link from "next/link";
import React from "react";

type DashboardStatProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: "brand" | "success" | "gold" | "ink";
  href?: string;
  loading?: boolean;
};

const iconToneClasses: Record<NonNullable<DashboardStatProps["tone"]>, string> = {
  brand: "bg-brand/10 text-brand",
  gold: "bg-gold-soft/50 text-gold",
  success: "bg-success/10 text-success",
  ink: "bg-ink/8 text-ink-soft",
};

export function DashboardStat({
  label,
  value,
  hint,
  icon,
  tone = "ink",
  href,
  loading = false,
}: DashboardStatProps) {
  const content = (
    <article className="group rounded-3xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-line hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          {loading ? (
            <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-line" />
          ) : (
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1.5 text-xs text-ink-soft/80">{hint}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconToneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
