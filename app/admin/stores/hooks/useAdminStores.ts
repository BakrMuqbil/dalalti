"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

export type Plan = {
  id: string;
  name: string;
  billingPeriod: "MONTHLY" | "YEARLY";
  price: string;
};

export type Store = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  owner: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  subscription: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    startsAt: string;
    endsAt: string;
    plan: Plan;
  } | null;
};

export type StoreForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
  storeName: string;
  slug: string;
  planId: string;
};

const emptyForm: StoreForm = {
  name: "",
  phone: "",
  email: "",
  password: "",
  storeName: "",
  slug: "",
  planId: "",
};

export function useAdminStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showAddStore, setShowAddStore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<StoreForm>(emptyForm);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/stores", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحميل المتاجر");
      }

      setStores(data.stores);
    } catch (error) {
      console.error("Failed to load stores:", error);
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل المتاجر");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);

      const response = await fetch("/api/admin/plans", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحميل الباقات");
      }

      setPlans(data.plans);

      if (data.plans.length > 0) {
        setForm((current) => ({
          ...current,
          planId: current.planId || data.plans[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
      setFormError(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الباقات");
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
    void loadPlans();
  }, [loadStores, loadPlans]);

  function updateField(field: keyof StoreForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openAddStore() {
    setFormError("");
    setShowAddStore(true);
  }

  function closeAddStore() {
    if (creating) return;
    setShowAddStore(false);
    setFormError("");
  }

  async function handleCreateStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل إنشاء المتجر");
      }

      setShowAddStore(false);
      setForm({ ...emptyForm, planId: plans[0]?.id || "" });
      await loadStores();
    } catch (error) {
      console.error("Create store failed:", error);
      setFormError(error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء المتجر");
    } finally {
      setCreating(false);
    }
  }

  const requestStoreAction = useCallback(async (storeId: string, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "فشلت العملية");
    }
    return data;
  }, []);

  return {
    stores,
    plans,
    loading,
    loadingPlans,
    error,
    formError,
    creating,
    form,
    showAddStore,
    updateField,
    loadStores,
    openAddStore,
    closeAddStore,
    handleCreateStore,
    setFormError,
    requestStoreAction,
  };
}
