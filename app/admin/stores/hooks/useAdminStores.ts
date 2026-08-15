"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { readJson, fetchWithAuth } from "@/lib/api-client";

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

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
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

  // Pagination & Filtering
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("limit", String(pagination.limit));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (planFilter) params.set("planId", planFilter);
    return params.toString();
  }, [pagination.page, pagination.limit, search, statusFilter, planFilter]);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const query = buildQuery();
      const response = await fetchWithAuth(`/api/admin/stores?${query}`);
      const data = await readJson<{ stores: Store[]; pagination: Pagination }>(
        response,
        "فشل تحميل المتاجر",
      );

      setStores(data.stores);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load stores:", error);
      const msg = error instanceof Error ? error.message : "حدث خطأ أثناء تحميل المتاجر";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const loadPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);

      const response = await fetchWithAuth("/api/admin/plans");
      const data = await readJson(response, "فشل تحميل الباقات");

      setPlans(data.plans);

      if (data.plans.length > 0) {
        setForm((current) => ({
          ...current,
          planId: current.planId || data.plans[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
      const msg = error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الباقات";
      setFormError(msg);
      throw new Error(msg);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function goToPage(page: number) {
    setPagination((current) => ({ ...current, page }));
  }

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
      const response = await fetchWithAuth("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await readJson(response, "فشل إنشاء المتجر");

      setShowAddStore(false);
      setForm({ ...emptyForm, planId: plans[0]?.id || "" });
      await loadStores();
    } catch (error) {
      console.error("Create store failed:", error);
      const msg = error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء المتجر";
      setFormError(msg);
      throw new Error(msg);
    } finally {
      setCreating(false);
    }
  }

  const requestStoreAction = useCallback(
    async (storeId: string, payload: Record<string, unknown>) => {
      const response = await fetchWithAuth(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(response, "فشلت العملية");
      return data;
    },
    [],
  );

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
    pagination,
    search,
    statusFilter,
    planFilter,
    updateField,
    loadStores,
    openAddStore,
    closeAddStore,
    handleCreateStore,
    setFormError,
    requestStoreAction,
    goToPage,
    setSearch,
    setStatusFilter,
    setPlanFilter,
  };
}
