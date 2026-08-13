import type { Plan } from "../hooks/useAdminStores";

type Props = { plans: Plan[]; loading: boolean; selectedPlanId: string; onSelect: (id: string) => void };

export function PlanSelector({ plans, loading, selectedPlanId, onSelect }: Props) {
  return <section className="border-t border-line pt-6"><h3 className="mb-4 font-bold text-ink">الباقة</h3>
    {loading ? <div className="rounded-xl border border-line p-4 text-sm text-ink-soft">جاري تحميل الباقات...</div> : plans.length === 0 ? <div className="rounded-xl border border-danger/25 bg-danger-bg p-4 text-sm text-danger">لا توجد باقات فعالة.</div> : <div className="grid gap-4 sm:grid-cols-2">{plans.map((plan) => { const selected = selectedPlanId === plan.id; return <label key={plan.id} className={`cursor-pointer rounded-2xl border p-4 transition ${selected ? "border-brand bg-background ring-1 ring-gold" : "border-line hover:border-gold hover:bg-background"}`}><input type="radio" name="plan" value={plan.id} checked={selected} onChange={() => onSelect(plan.id)} className="sr-only" /><div className="flex items-center justify-between gap-4"><div><div className="font-bold text-ink">{plan.name}</div><div className="mt-1 text-sm text-ink-soft">{plan.billingPeriod === "MONTHLY" ? "اشتراك شهري" : "اشتراك سنوي"}</div></div><div className="font-mono text-lg font-medium text-ink">{plan.price}<span className="mr-1 font-sans text-xs font-normal text-ink-soft">ريال</span></div></div></label>; })}</div>}
  </section>;
}
