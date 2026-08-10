"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan, Store } from "../hooks/useAdminStores";

type DetailedStore = Store & {
  description?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  updatedAt?: string;
  counts: { products: number; categories: number; customers: number; orders: number };
  owner: Store["owner"] & { role?: string; createdAt?: string };
};

type Props = {
  open: boolean;
  store: Store | null;
  plans: Plan[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onRequest: (storeId: string, payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" });
const formatDate = (v?: string | null) => v ? dateFormatter.format(new Date(v)) : "—";

export function StoreDetailsModal({ open, store, plans, onClose, onRefresh, onRequest }: Props) {
  const [details, setDetails] = useState<DetailedStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", phone: "", description: "", ownerName: "", ownerPhone: "", ownerEmail: "" });

  async function loadDetails() {
    if (!store) return;
    try {
      setLoading(true); setError("");
      const response = await fetch(`/api/admin/stores/${store.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "فشل تحميل التفاصيل");
      const s = data.store as DetailedStore;
      setDetails(s);
      setForm({ name: s.name || "", slug: s.slug || "", phone: s.phone || "", description: s.description || "", ownerName: s.owner?.name || "", ownerPhone: s.owner?.phone || "", ownerEmail: s.owner?.email || "" });
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) void loadDetails(); else { setDetails(null); setError(""); setSuccess(""); } }, [open, store?.id]);

  const subscription = details?.subscription;
  const canCancel = subscription?.status === "ACTIVE";
  const canActivate = !!subscription && subscription.status !== "ACTIVE";

  async function action(payload: Record<string, unknown>, message = "تم تنفيذ العملية") {
    if (!store) return;
    try {
      setSaving(true); setError(""); setSuccess("");
      const result = await onRequest(store.id, payload);
      if (!result.success) throw new Error(result.message || "فشلت العملية");
      setSuccess(result.message || message);
      await loadDetails();
      await onRefresh();
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ أثناء تنفيذ العملية"); }
    finally { setSaving(false); }
  }

  async function save() {
    if (!store) return;
    const payload: Record<string, unknown> = { ...form };
    if (newPassword.trim()) payload.newPassword = newPassword;
    try {
      setSaving(true); setError(""); setSuccess("");
      const result = await onRequest(store.id, payload);
      if (!result.success) throw new Error(result.message || "فشل تحديث البيانات");
      setSuccess(result.message || "تم تحديث البيانات");
      setNewPassword("");
      await loadDetails(); await onRefresh();
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ أثناء الحفظ"); }
    finally { setSaving(false); }
  }

  if (!open || !store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-line bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-5 backdrop-blur">
          <div><span className="text-xs font-medium text-gold">STORE CONTROL</span><h2 className="mt-1 text-xl font-bold">إدارة حساب {store.name}</h2><p className="mt-1 text-sm text-ink-soft">تفاصيل المتجر، المالك، الاشتراك والإجراءات الإدارية</p></div>
          <button onClick={onClose} disabled={saving} className="rounded-xl px-3 py-2 text-ink-soft hover:bg-background">✕</button>
        </div>

        <div className="space-y-5 p-6">
          {error && <div className="rounded-2xl border border-danger/25 bg-danger-bg p-4 text-sm text-danger">{error}</div>}
          {success && <div className="rounded-2xl border border-success/25 bg-success-bg p-4 text-sm text-success">{success}</div>}
          {loading ? <div className="rounded-2xl border border-line bg-white p-12 text-center text-sm text-ink-soft">جاري تحميل تفاصيل الحساب...</div> : details && <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[['المنتجات', details.counts.products], ['التصنيفات', details.counts.categories], ['العملاء', details.counts.customers], ['الطلبات', details.counts.orders]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-ink-soft">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>)}
            </div>

            <section className="rounded-2xl border border-line bg-white p-6">
              <div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">التحكم بالحساب</h3><p className="mt-1 text-sm text-ink-soft">تجميد أو إعادة تفعيل المتجر والاشتراك</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${details.status === 'ACTIVE' ? 'bg-success-bg text-success' : 'bg-surface-alt text-ink-soft'}`}>{details.status === 'ACTIVE' ? 'المتجر نشط' : 'المتجر موقوف'}</span></div>
              <div className="flex flex-wrap gap-3">
                <button disabled={saving} onClick={() => action({ action: details.status === 'ACTIVE' ? 'SUSPEND_STORE' : 'ACTIVATE_STORE' })} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:border-gold disabled:opacity-50">{details.status === 'ACTIVE' ? 'تجميد المتجر' : 'تفعيل المتجر'}</button>
                {subscription && <button disabled={saving} onClick={() => action({ action: canCancel ? 'CANCEL_SUBSCRIPTION' : 'ACTIVATE_SUBSCRIPTION' })} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:border-gold disabled:opacity-50">{canCancel ? 'إلغاء الاشتراك' : 'تفعيل الاشتراك'}</button>}
                <div className="flex items-center gap-2 rounded-xl border border-line bg-background p-1"><input value={extendDays} onChange={(e) => setExtendDays(e.target.value.replace(/\D/g, ""))} className="w-20 bg-transparent px-2 py-2 text-sm outline-none" placeholder="30"/><button disabled={saving || !subscription} onClick={() => action({ action: 'EXTEND_SUBSCRIPTION', days: Number(extendDays) }, 'تم تمديد الاشتراك')} className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white disabled:opacity-50">تمديد يومًا</button></div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-line bg-white p-6">
                <h3 className="font-bold">بيانات المتجر والمالك</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[['اسم المتجر','name'],['الرابط','slug'],['هاتف المتجر','phone'],['اسم المالك','ownerName'],['هاتف المالك','ownerPhone'],['البريد','ownerEmail']].map(([label, key]) => <label key={key} className="block"><span className="mb-2 block text-xs font-medium text-ink-soft">{label}</span><input value={form[key as keyof typeof form]} onChange={(e) => setForm((x) => ({ ...x, [key]: e.target.value }))} className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></label>)}
                  <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-medium text-ink-soft">الوصف</span><textarea value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" /></label>
                  <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-medium text-ink-soft">كلمة مرور جديدة (اختياري)</span><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" placeholder="8 أحرف على الأقل" /></label>
                </div>
                <button disabled={saving} onClick={save} className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">حفظ التعديلات</button>
              </section>

              <section className="rounded-2xl border border-line bg-white p-6">
                <h3 className="font-bold">الاشتراك</h3>
                {subscription ? <div className="mt-5 space-y-4"><div className="rounded-2xl bg-background p-4"><div className="flex items-center justify-between"><strong>{subscription.plan.name}</strong><span className="font-mono text-sm">{subscription.plan.price} ريال</span></div><p className="mt-1 text-xs text-ink-soft">{subscription.plan.billingPeriod === 'MONTHLY' ? 'شهري' : 'سنوي'} · {subscription.status}</p><div className="mt-3 grid grid-cols-2 gap-3 text-xs text-ink-soft"><div>البداية<br/><strong className="text-ink">{formatDate(subscription.startsAt)}</strong></div><div>النهاية<br/><strong className="text-ink">{formatDate(subscription.endsAt)}</strong></div></div></div><div><p className="mb-2 text-xs font-medium text-ink-soft">تغيير الباقة</p><div className="grid gap-2 sm:grid-cols-2">{plans.map((plan) => <button key={plan.id} disabled={saving || subscription.plan.id === plan.id} onClick={() => action({ action: 'CHANGE_PLAN', planId: plan.id })} className={`rounded-xl border p-3 text-right ${subscription.plan.id === plan.id ? 'border-brand bg-background' : 'border-line hover:border-gold'} disabled:opacity-60`}><div className="font-semibold text-sm">{plan.name}</div><div className="mt-1 text-xs text-ink-soft">{plan.price} ريال · {plan.billingPeriod === 'MONTHLY' ? 'شهري' : 'سنوي'}</div></button>)}</div></div></div> : <div className="rounded-2xl border border-dashed border-line p-6 text-center"><p className="font-semibold">لا يوجد اشتراك</p><p className="mt-1 text-sm text-ink-soft">اختر باقة لإنشاء اشتراك جديد.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{plans.map((plan) => <button key={plan.id} disabled={saving} onClick={() => action({ action: 'CHANGE_PLAN', planId: plan.id })} className="rounded-xl border border-line p-3 text-right hover:border-gold"><div className="font-semibold text-sm">{plan.name}</div><div className="mt-1 text-xs text-ink-soft">{plan.price} ريال</div></button>)}</div></div>}
              </section>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
