"use client";

import { useCallback, useEffect, useState } from "react";
import { readJson, fetchWithAuth } from "@/lib/api-client";

export type Plan = {
  id: string;
  name: string;
  billingPeriod: "MONTHLY" | "YEARLY";
  price: string;
  isActive?: boolean;
  subscriptionsCount?: number;
};

export type PlanForm = {
  name: string;
  billingPeriod: "MONTHLY" | "YEARLY";
  price: string;
  isActive: boolean;
};

const emptyForm: PlanForm = {
  name: "",
  billingPeriod: "MONTHLY",
  price: "",
  isActive: true,
};

export function useAdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [formError, setFormError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchWithAuth("/api/admin/plans");
      const data = await readJson(response, "فشل تحميل الباقات");
      setPlans(data.plans);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      billingPeriod: plan.billingPeriod,
      price: plan.price,
      isActive: plan.isActive ?? true,
    });
  }

  function startAdd() {
    setFormError("");
    setForm(emptyForm);
    setShowAdd(true);
  }

  function reset() {
    setEditing(null);
    setShowAdd(false);
    setForm(emptyForm);
    setFormError("");
  }

  async function updatePlan(planId: string, payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetchWithAuth(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(response, "فشل تحديث الباقة");
      return data;
    } finally {
      setSaving(false);
    }
  }

  async function createPlan(payload: { name: string; billingPeriod: string; price: number }) {
    setSaving(true);
    setFormError("");
    try {
      const response = await fetchWithAuth("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(response, "فشل إنشاء الباقة");
      reset();
      await load();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      setFormError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof PlanForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return {
    plans,
    loading,
    saving,
    error,
    formError,
    form,
    editing,
    showAdd,
    load,
    startEdit,
    startAdd,
    reset,
    updatePlan,
    createPlan,
    updateField,
    setFormError,
  };
}
