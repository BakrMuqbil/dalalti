import Link from "next/link";
import { AlertTriangleIcon, CrownIcon, StoreIcon } from "@/components/icons";
import { AdminStats } from "../types";

export function AdminHero({ stats }: { stats: AdminStats | null }) {
  const suspendedStores = stats?.suspendedStores ?? 0;
  const expiringSubscriptions = stats?.expiringSubscriptions ?? 0;
  const hasNews = suspendedStores > 0 || expiringSubscriptions > 0;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-gold) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-background px-3 py-1.5 text-xs font-bold tracking-wide text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            DALALTI ADMIN
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            مركز التحكم بالمنصة
          </h1>

          {hasNews ? (
            <div className="mt-4 space-y-2 text-sm text-ink-soft">
              {suspendedStores > 0 && (
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <StoreIcon width={15} height={15} />
                  </span>
                  <span>
                    <strong className="text-ink">{suspendedStores} متجر</strong>{" "}
                    موقوف ويحتاج إلى مراجعة.
                  </span>
                </div>
              )}

              {expiringSubscriptions > 0 && (
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                    <AlertTriangleIcon width={15} height={15} />
                  </span>
                  <span>
                    <strong className="text-danger">
                      {expiringSubscriptions} اشتراك
                    </strong>{" "}
                    ينتهي خلال 7 أيام.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <CrownIcon width={15} height={15} />
              </span>
              <span>لا توجد تنبيهات عاجلة حاليًا. المنصة تعمل بصورة طبيعية.</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/stores"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-deep"
          >
            <StoreIcon width={16} height={16} />
            إدارة المتاجر
          </Link>
          <Link
            href="/admin/plans"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold text-ink transition hover:border-gold hover:bg-background"
          >
            <CrownIcon width={16} height={16} />
            إدارة الباقات
          </Link>
        </div>
      </div>
    </section>
  );
}
