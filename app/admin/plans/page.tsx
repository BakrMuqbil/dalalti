"use client";

import { FormEvent } from "react";
import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { CrownIcon, AlertTriangleIcon } from "@/components/icons";
import { useAdminPlans } from "./hooks/useAdminPlans";
import { PlansHeader } from "./components/PlansHeader";
import { PlanCard } from "./components/PlanCard";
import { EditPlanModal } from "./components/EditPlanModal";
import { AddPlanModal } from "./components/AddPlanModal";

export default function AdminPlansPage() {
  const {
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
  } = useAdminPlans();

  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const data = await updatePlan(editing.id, {
      ...form,
      price: Number(form.price),
    });

    showToast(data.message || "تم تحديث الباقة", "success");
    reset();
    await load();
  }

  async function handleToggle(plan: { id: string; isActive?: boolean; name: string }) {
    const newActive = !(plan.isActive ?? true);
    await updatePlan(plan.id, { isActive: newActive });
    showToast(newActive ? "تم تفعيل الباقة" : "تم تعطيل الباقة", "success");
    await load();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await createPlan({
        name: form.name,
        billingPeriod: form.billingPeriod,
        price: Number(form.price),
      });
      showToast(data.message || "تم إنشاء الباقة بنجاح", "success");
    } catch {
      // error already set in hook
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background text-ink">
      <PlansHeader onRefresh={load} onAdd={startAdd} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && !loading && (
          <div className="mb-6">
            <EmptyState
              icon={
                <AlertTriangleIcon width={28} height={28} className="text-danger" />
              }
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
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                saving={saving}
                onEdit={startEdit}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {editing && (
          <EditPlanModal
            editing={editing}
            form={form}
            saving={saving}
            onClose={reset}
            onSubmit={handleSubmit}
            onFieldChange={updateField}
          />
        )}

        <AddPlanModal
          open={showAdd}
          creating={saving}
          form={{ name: form.name, billingPeriod: form.billingPeriod, price: form.price }}
          formError={formError}
          onClose={reset}
          onSubmit={handleCreate}
          onChange={updateField}
        />
      </div>
    </main>
  );
}
