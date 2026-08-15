"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminIdentity } from "./AdminIdentityContext";

const navigation = [
  { href: "/admin/dashboard", label: "لوحة الإدارة" },
  { href: "/admin/stores", label: "المتاجر" },
  { href: "/admin/plans", label: "الباقات" },
];

export function AdminHeader() {
  const { userName } = useAdminIdentity();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("فشل تسجيل الخروج");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/admin/dashboard" className="shrink-0">
            <div className="font-display text-lg font-bold text-brand">
              دلالتي
            </div>
            <div className="text-[11px] text-ink-soft">لوحة الإدارة</div>
          </Link>

          <div className="hidden h-9 w-px bg-line sm:block" />

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">
              {userName}
            </div>
            <div className="truncate text-xs text-ink-soft">
              مشرف المنصة
            </div>
          </div>
        </div>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  active
                    ? "bg-brand text-white"
                    : "text-ink-soft hover:bg-background hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft transition hover:bg-background hover:text-danger disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
          </button>
        </div>
      </div>
    </header>
  );
}
