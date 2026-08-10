import type { FormEvent } from "react";
import type { Plan, StoreForm } from "../hooks/useAdminStores";
import { PlanSelector } from "./PlanSelector";
import { StoreOwnerFields } from "./StoreOwnerFields";
import { StoreFields } from "./StoreFields";

type Props = {
  open: boolean;
  plans: Plan[];
  loadingPlans: boolean;
  creating: boolean;
  form: StoreForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof StoreForm, value: string) => void;
  onClearError: () => void;
};

export function AddStoreModal({ open, plans, loadingPlans, creating, form, formError, onClose, onSubmit, onChange }: Props) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><span className="text-xs font-medium text-gold">NEW STORE</span><h2 className="mt-1 text-xl font-bold text-ink">إضافة متجر جديد</h2><p className="mt-1 text-sm text-ink-soft">إنشاء المالك والمتجر والاشتراك تلقائيًا</p></div><button type="button" onClick={onClose} disabled={creating} aria-label="إغلاق" className="rounded-xl px-3 py-2 text-ink-soft hover:bg-background">✕</button></div>
    <form onSubmit={onSubmit} className="space-y-6 p-6">
      {formError && <div className="rounded-xl border border-danger/25 bg-danger-bg p-4 text-sm text-danger">{formError}</div>}
      <StoreOwnerFields form={form} onChange={onChange} />
      <StoreFields form={form} onChange={onChange} />
      <PlanSelector plans={plans} loading={loadingPlans} selectedPlanId={form.planId} onSelect={(value) => onChange("planId", value)} />
      <div className="flex justify-end gap-3 border-t border-line pt-6"><button type="button" onClick={onClose} disabled={creating} className="rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink-soft hover:bg-background disabled:opacity-50">إلغاء</button><button type="submit" disabled={creating || loadingPlans || plans.length === 0} className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{creating ? "جاري إنشاء المتجر..." : "إنشاء المتجر"}</button></div>
    </form>
  </div></div>;
}
