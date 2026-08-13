"use client";

import { useState } from "react";
import { AddStoreModal } from "./components/AddStoreModal";
import { StoresHeader } from "./components/StoresHeader";
import { StoresStats } from "./components/StoresStats";
import { StoresTable } from "./components/StoresTable";
import { StoreDetailsModal } from "./components/StoreDetailsModal";
import { useAdminStores, type Store } from "./hooks/useAdminStores";

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

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-ink">
      <StoresHeader onRefresh={loadStores} onAdd={openAddStore} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StoresStats stores={stores} loading={loading} />

        {error && (
          <div className="mb-6 rounded-2xl border border-danger/25 bg-danger-bg p-5 text-sm text-danger">
            {error}
          </div>
        )}

        <StoresTable stores={stores} loading={loading} onDetails={(store) => setSelectedStore(store)} />

        <AddStoreModal
          open={showAddStore}
          plans={plans}
          loadingPlans={loadingPlans}
          creating={creating}
          form={form}
          formError={formError}
          onClose={closeAddStore}
          onSubmit={handleCreateStore}
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
