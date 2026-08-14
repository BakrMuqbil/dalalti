"use client";

import { Plan } from "../hooks/useAdminPlans";

interface PlanCardProps {
  plan: Plan;
  saving: boolean;
  onEdit: (plan: Plan) => void;
  onToggle: (plan: Plan) => void;
}

export function PlanCard({ plan, saving, onEdit, onToggle }: PlanCardProps) {
  const isActive = plan.isActive !== false;

  return (
    <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_12px_40px_-30px_rgba(43,36,32,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{plan.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {plan.billingPeriod === "MONTHLY" ? "اشتراك شهري" : "اشتراك سنوي"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isActive
              ? "bg-success-bg text-success"
              : "bg-surface-alt text-ink-soft"
          }`}
        >
          {isActive ? "فعالة" : "معطلة"}
        </span>
      </div>

      <p className="mt-6 font-mono text-3xl font-semibold">
        {plan.price}
        <span className="mr-2 text-sm font-normal text-ink-soft">ريال</span>
      </p>

      <div className="mt-4 text-xs text-ink-soft">
        يمكن استخدامها من شاشة إدارة اشتراك المتجر.
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onEdit(plan)}
          className="flex-1 rounded-xl border border-line px-3 py-2 text-sm hover:border-gold"
        >
          تعديل
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onToggle(plan)}
          className="rounded-xl border border-line px-3 py-2 text-sm hover:border-gold"
        >
          {isActive ? "تعطيل" : "تفعيل"}
        </button>
      </div>
    </article>
  );
}
