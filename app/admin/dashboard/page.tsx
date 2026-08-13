"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { AdminHero } from "./components/AdminHero";
import { AdminStat } from "./components/AdminStat";
import {
  StoreIcon,
  AlertTriangleIcon,
  CrownIcon,
  UsersIcon,
  BoxIcon,
  ReceiptIcon,
  ArrowLeftIcon,
  PackageCheckIcon,
} from "@/components/icons";

function ManagementCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-background"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-gold/10 group-hover:text-gold">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-ink">{title}</div>
          <div className="mt-1 text-xs leading-5 text-ink-soft">{description}</div>
        </div>
      </div>
      <ArrowLeftIcon
        width={17}
        height={17}
        className="shrink-0 text-ink-soft transition-transform group-hover:-translate-x-1 group-hover:text-brand"
      />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { stats, loading, error, reload } = useAdminDashboard();

  if (error) {
    return (
      <main dir="rtl" className="min-h-screen bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-danger/30 bg-danger-bg px-6 py-5 text-sm font-medium text-danger">
          {error}
          <button
            type="button"
            onClick={() => void reload()}
            className="mr-3 font-bold underline"
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <span className="text-[11px] font-bold tracking-[0.14em] text-gold">
              DALALTI ADMIN
            </span>
            <h1 className="mt-0.5 font-display text-xl font-bold text-ink sm:text-2xl">
              لوحة الإدارة
            </h1>
          </div>

          <nav aria-label="التنقل الإداري" className="flex items-center gap-2">
            <Link
              href="/admin/stores"
              className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-gold hover:bg-background hover:text-ink"
            >
              المتاجر
            </Link>
            <Link
              href="/admin/plans"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-deep"
            >
              الباقات
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <AdminHero stats={stats} />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat
            label="اشتراكات تنتهي قريبًا"
            value={loading ? "—" : (stats?.expiringSubscriptions ?? 0)}
            hint="خلال 7 أيام القادمة"
            tone="danger"
            highlight={!!stats && stats.expiringSubscriptions > 0}
            href="/admin/stores"
            icon={<AlertTriangleIcon width={19} height={19} />}
          />
          <AdminStat
            label="متاجر موقوفة"
            value={loading ? "—" : (stats?.suspendedStores ?? 0)}
            hint="تحتاج مراجعة"
            tone="gold"
            href="/admin/stores"
            icon={<StoreIcon width={19} height={19} />}
          />
          <AdminStat
            label="اشتراكات نشطة"
            value={loading ? "—" : (stats?.activeSubscriptions ?? 0)}
            hint={
              loading
                ? undefined
                : `${stats?.monthlySubscriptions ?? 0} شهري · ${stats?.yearlySubscriptions ?? 0} سنوي`
            }
            tone="success"
            icon={<CrownIcon width={19} height={19} />}
          />
          <AdminStat
            label="إجمالي المتاجر"
            value={loading ? "—" : (stats?.totalStores ?? 0)}
            hint={loading ? undefined : `${stats?.activeStores ?? 0} نشط`}
            tone="brand"
            href="/admin/stores"
            icon={<StoreIcon width={19} height={19} />}
          />
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-ink">نشاط المنصة</h2>
            <p className="mt-1 text-sm text-ink-soft">
              مؤشرات عامة تساعدك على متابعة حجم المنصة دون خلطها بالتنبيهات.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStat
              label="أصحاب المتاجر"
              value={loading ? "—" : (stats?.totalOwners ?? 0)}
              tone="ink"
              icon={<UsersIcon width={19} height={19} />}
            />
            <AdminStat
              label="إجمالي المنتجات"
              value={loading ? "—" : (stats?.totalProducts ?? 0)}
              hint="عبر كل المتاجر"
              tone="ink"
              icon={<BoxIcon width={19} height={19} />}
            />
            <AdminStat
              label="إجمالي الطلبات"
              value={loading ? "—" : (stats?.totalOrders ?? 0)}
              hint={loading ? undefined : `${stats?.totalCustomers ?? 0} عميل مسجّل`}
              tone="ink"
              icon={<ReceiptIcon width={19} height={19} />}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-[0.14em] text-gold">
                  CONTROL CENTER
                </span>
                <h2 className="mt-1 font-display text-lg font-bold text-ink">
                  إدارة المنصة
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  العمليات الإدارية الأساسية في مكان واحد.
                </p>
              </div>
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand sm:flex">
                <PackageCheckIcon width={19} height={19} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ManagementCard
                href="/admin/stores"
                icon={<StoreIcon width={19} height={19} />}
                title="إدارة المتاجر"
                description="تفاصيل المالك، الحالة، الاشتراك، التجميد والتفعيل."
              />
              <ManagementCard
                href="/admin/plans"
                icon={<CrownIcon width={19} height={19} />}
                title="إدارة الباقات"
                description="الأسعار، الفترات، وتفعيل أو تعطيل الباقات."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <span className="text-[11px] font-bold tracking-[0.14em] text-gold">
              QUICK ACTIONS
            </span>
            <h2 className="mt-1 font-display text-lg font-bold text-ink">
              إجراءات سريعة
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              انتقل مباشرة إلى الإجراء الذي يحتاجه انتباهك.
            </p>

            <div className="mt-5 space-y-3">
              <ManagementCard
                href="/admin/stores"
                icon={<AlertTriangleIcon width={18} height={18} />}
                title="مراجعة المتاجر"
                description="فحص المتاجر الموقوفة والاشتراكات القريبة من الانتهاء."
              />
              <ManagementCard
                href="/admin/plans"
                icon={<CrownIcon width={18} height={18} />}
                title="مراجعة الباقات"
                description="تحديث الأسعار أو حالة الباقات المتاحة للمتاجر."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
