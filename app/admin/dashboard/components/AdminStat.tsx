import { ReactNode } from "react";
import Link from "next/link";

type AdminStatProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  tone?: "brand" | "success" | "gold" | "danger" | "ink";
  href?: string;
  highlight?: boolean;
};

const iconToneClasses: Record<NonNullable<AdminStatProps["tone"]>, string> = {
  brand: "bg-brand/10 text-brand",
  gold: "bg-gold/10 text-gold",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  ink: "bg-ink/8 text-ink-soft",
};

export function AdminStat({
  label,
  value,
  hint,
  icon,
  tone = "ink",
  href,
  highlight = false,
}: AdminStatProps) {
  const content = (
    <article
      className={`h-full rounded-2xl border bg-surface p-5 transition duration-200 ${
        highlight
          ? "border-danger/40 shadow-[0_2px_12px_rgba(166,75,75,0.10)]"
          : "border-line shadow-sm"
      } ${href ? "hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-ink-soft/80">{hint}</p>}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconToneClasses[tone]}`}
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
