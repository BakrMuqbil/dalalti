"use client";

import { FormEvent } from "react";
import { Plan, PlanForm } from "../hooks/useAdminPlans";

interface EditPlanModalProps {
  editing: Plan;
  form: PlanForm;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onFieldChange: (field: keyof PlanForm, value: string | boolean) => void;
}

export function EditPlanModal({
  editing,
  form,
  saving,
  onClose,
  onSubmit,
  onFieldChange,
}: EditPlanModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gold">EDIT PLAN</span>
            <h2 className="mt-1 text-xl font-bold">تعديل الباقة</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-ink-soft"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">اسم الباقة</span>
            <input
              required
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">السعر</span>
            <input
              required
              min="0"
              type="number"
              value={form.price}
              onChange={(e) => onFieldChange("price", e.target.value)}
              className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">الفترة</span>
            <select
              value={form.billingPeriod}
              onChange={(e) =>
                onFieldChange("billingPeriod", e.target.value as "MONTHLY" | "YEARLY")
              }
              className="w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-gold"
            >
              <option value="MONTHLY">شهري</option>
              <option value="YEARLY">سنوي</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-5 py-2.5 text-sm"
          >
            إلغاء
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}
