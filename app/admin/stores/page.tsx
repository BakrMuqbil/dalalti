"use client";

import { useState } from "react";
import { AddStoreModal } from "./components/AddStoreModal";
import { StoresHeader } from "./components/StoresHeader";
import { StoresStats } from "./components/StoresStats";
import { StoresTable } from "./components/StoresTable";
import { StoreDetailsModal } from "./components/StoreDetailsModal";
import { useAdminStores, type Store } from "./hooks/useAdminStores";
import { useToast } from "@/hooks/useToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertTriangleIcon } from "@/components/icons";

export default function AdminStoresPage() {
  const {
    stores,
    plans,
    loading,
    loadingPlans,
    error,
    formError,
    creating,
    form,
    updateField,
    loadStores,
    openAddStore,
    closeAddStore,
    showAddStore,
    handleCreateStore,
    setFormError,
    requestStoreAction,
  } = useAdminStores();

  const { showToast } = useToast();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  async function handleCreateStoreWrapper(event: React.FormEvent<HTMLFormElement>) {
    try {
      await handleCreateStore(event);
      showToast("تم إنشاء المتجر بنجاح", "success");
    } catch {
      showToast(formError || "فشل إنشاء المتجر", "error");
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background text-ink">
      <StoresHeader onRefresh={loadStores} onAdd={openAddStore} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && !loading ? (
          <div className="mb-6">
            <EmptyState
              icon={<AlertTriangleIcon width={28} height={28} className="text-danger" />}
              title="تعذر تحميل المتاجر"
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => void loadStores()}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep"
                >
                  إعادة المحاولة
                </button>
              }
            />
          </div>
        ) : (
          <>
            <StoresStats stores={stores} loading={loading} />
            <StoresTable stores={stores} loading={loading} onDetails={(store) => setSelectedStore(store)} />
          </>
        )}

        <AddStoreModal
          open={showAddStore}
          plans={plans}
          loadingPlans={loadingPlans}
          creating={creating}
          form={form}
          formError={formError}
          onClose={closeAddStore}
          onSubmit={handleCreateStoreWrapper}
          onChange={updateField}
          onClearError={() => setFormError("")}
        />
        <StoreDetailsModal
          open={Boolean(selectedStore)}
          store={selectedStore}
          plans={plans}
          onClose={() => setSelectedStore(null)}
          onRefresh={loadStores}
          onRequest={requestStoreAction}
        />
      </div>
    </main>
  );
}
