"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { CrownIcon, AlertTriangleIcon } from "@/components/icons";

type Plan = { id: string; name: string; billingPeriod: "MONTHLY" | "YEARLY"; price: string; isActive?: boolean; subscriptionsCount?: number };

const empty: Omit<Plan, 'id' | 'subscriptionsCount'> = { name: "", billingPeriod: "MONTHLY", price: "", isActive: true };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Plan | null>(null);
  const { showToast } = useToast();

  async function load() {
    try {
      setLoading(true); setError("");
      const response = await fetch("/api/admin/plans", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "فشل تحميل الباقات");
      setPlans(data.plans);
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function startEdit(plan: Plan) {
    setEditing(plan);
    setForm({ name: plan.name, billingPeriod: plan.billingPeriod, price: plan.price, isActive: plan.isActive ?? true });
  }

  function reset() { setEditing(null); setForm(empty); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true); setError("");
      const response = await fetch(`/api/admin/plans/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: Number(form.price) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "فشل تحديث الباقة");
      showToast(data.message || "تم تحديث الباقة", "success");
      reset(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setSaving(false); }
  }

  async function toggle(plan: Plan) {
    try {
      setSaving(true); setError("");
      const response = await fetch(`/api/admin/plans/${plan.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !(plan.isActive ?? true) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "فشل تغيير حالة الباقة");
      showToast(plan.isActive === false ? "تم تفعيل الباقة" : "تم تعطيل الباقة", "success");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setSaving(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-background text-ink">
    <header className="border-b border-line bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8"><div><span className="text-xs font-medium text-gold">SUBSCRIPTIONS</span><h1 className="mt-1 text-2xl font-bold">إدارة الباقات</h1><p className="mt-1 text-sm text-ink-soft">تعديل الأسعار والفترات وحالة الباقات المستخدمة في اشتراكات المتاجر.</p></div><div className="flex gap-2"><Link href="/admin/dashboard" className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-background">لوحة الإدارة</Link><Link href="/admin/stores" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">المتاجر</Link></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {error && !loading && (
        <div className="mb-6">
          <EmptyState
            icon={<AlertTriangleIcon width={28} height={28} className="text-danger" />}
            title="تعذر تحميل الباقات"
            description={error}
            action={
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep"
              >
                إعادة المحاولة
              </button>
            }
          />
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full">
            <Spinner label="جاري تحميل الباقات..." />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<CrownIcon width={28} height={28} className="text-ink-soft" />}
              title="لا توجد باقات"
              description="لم يتم إنشاء أي باقة حتى الآن."
            />
          </div>
        ) : plans.map(plan => <article key={plan.id} className="rounded-2xl border border-line bg-white p-6 shadow-[0_12px_40px_-30px_rgba(43,36,32,0.45)]"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{plan.name}</h2><p className="mt-1 text-sm text-ink-soft">{plan.billingPeriod === "MONTHLY" ? "اشتراك شهري" : "اشتراك سنوي"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive === false ? "bg-surface-alt text-ink-soft" : "bg-success-bg text-success"}`}>{plan.isActive === false ? "معطلة" : "فعالة"}</span></div><p className="mt-6 font-mono text-3xl font-semibold">{plan.price}<span className="mr-2 text-sm font-normal text-ink-soft">ريال</span></p><div className="mt-4 text-xs text-ink-soft">يمكن استخدامها من شاشة إدارة اشتراك المتجر.</div><div className="mt-5 flex gap-2"><button disabled={saving} onClick={() => startEdit(plan)} className="flex-1 rounded-xl border border-line px-3 py-2 text-sm hover:border-gold">تعديل</button><button disabled={saving} onClick={() => toggle(plan)} className="rounded-xl border border-line px-3 py-2 text-sm hover:border-gold">{plan.isActive === false ? "تفعيل" : "تعطيل"}</button></div></article>)}
      </div>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><span className="text-xs font-medium text-gold">EDIT PLAN</span><h2 className="mt-1 text-xl font-bold">تعديل الباقة</h2></div><button type="button" onClick={reset} className="rounded-xl px-3 py-2 text-ink-soft">✕</button></div><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-medium">اسم الباقة</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold" /></label><label className="block"><span className="mb-2 block text-sm font-medium">السعر</span><input required min="0" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold" /></label><label className="block"><span className="mb-2 block text-sm font-medium">الفترة</span><select value={form.billingPeriod} onChange={e => setForm({ ...form, billingPeriod: e.target.value as "MONTHLY" | "YEARLY" })} className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold"><option value="MONTHLY">شهري</option><option value="YEARLY">سنوي</option></select></label></div><div className="mt-6 flex justify-end gap-2 border-t border-line pt-5"><button type="button" onClick={reset} className="rounded-xl border border-line px-5 py-2.5 text-sm">إلغاء</button><button disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ"}</button></div></form></div>}
    </div>
  </main>;
}
