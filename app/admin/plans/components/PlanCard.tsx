"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        <Badge tone={isActive ? "success" : "neutral"} className="px-3 py-1 text-xs font-semibold">
          {isActive ? "فعالة" : "معطلة"}
        </Badge>
      </div>

      <p className="mt-6 font-mono text-3xl font-semibold">
        {plan.price}
        <span className="ms-2 text-sm font-normal text-ink-soft">ريال</span>
      </p>

      <div className="mt-4 text-xs text-ink-soft">
        يمكن استخدامها من شاشة إدارة اشتراك المتجر.
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={saving}
          onClick={() => onEdit(plan)}
          className="flex-1 hover:border-gold"
        >
          تعديل
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={saving}
          onClick={() => onToggle(plan)}
          className="hover:border-gold"
        >
          {isActive ? "تعطيل" : "تفعيل"}
        </Button>
      </div>
    </article>
  );
}
