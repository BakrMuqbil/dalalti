import Link from "next/link";
import React, { ReactNode } from 'react';
import { ArrowLeftIcon } from "@/components/icons";


type ManagementCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  count?: number | null;
  active?: boolean;
};

export function ManagementCard({
  title,
  description,
  icon,
  href,
  count,
  active = false,
}: ManagementCardProps) {
  const content = (
    <div
      className={`group relative h-full rounded-3xl border bg-surface p-5 transition ${
        active
          ? "border-line shadow-sm hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
          : "border-line/70 opacity-80"
      }`}
    >
      {!active && (
        <span className="absolute left-4 top-4 rounded-full bg-background px-2.5 py-1 text-[10px] font-bold text-ink-soft">
          قريبًا
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            active ? "bg-brand/10 text-brand" : "bg-background text-ink-soft"
          }`}
        >
          {icon}
        </div>

        {typeof count === "number" && (
          <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-ink-soft">
            {count}
          </span>
        )}
      </div>

      <h3 className={`mt-4 font-display font-bold ${active ? "text-ink" : "text-ink-soft"}`}>
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-ink-soft">{description}</p>

      <div className="mt-5 flex items-center gap-1.5 text-sm font-bold">
        {active ? (
          <span className="flex items-center gap-1.5 text-brand transition group-hover:gap-2.5">
            فتح الإدارة
            <ArrowLeftIcon width={15} height={15} />
          </span>
        ) : (
          <span className="text-ink-soft/60">متاحة في الـ API — الواجهة قريبًا</span>
        )}
      </div>
    </div>
  );

  return active && href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
