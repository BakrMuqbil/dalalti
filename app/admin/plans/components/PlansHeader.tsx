"use client";

import Link from "next/link";

type Props = { onRefresh: () => void; onAdd: () => void };

export function PlansHeader({ onRefresh, onAdd }: Props) {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gold">
            <span className="h-2 w-2 rotate-45 bg-gold" />
            DALALTI · ADMIN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">إدارة الباقات</h1>
          <p className="mt-1 text-sm text-ink-soft">تعديل الأسعار والفترات وإنشاء باقات جديدة</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard" className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:border-brand hover:text-ink">لوحة الإدارة</Link>
          <Link href="/admin/stores" className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:border-brand hover:text-ink">المتاجر</Link>
          <button type="button" onClick={onRefresh} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:border-brand hover:text-ink">تحديث</button>
          <button type="button" onClick={onAdd} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark">+ باقة جديدة</button>
        </div>
      </div>
    </header>
  );
}
