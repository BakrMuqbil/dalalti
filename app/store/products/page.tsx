"use client";

import { Button } from "@/components/ui/Button";
import { useProducts } from "./hooks/useProducts";
import { ProductsStats } from "./components/ProductsStats";
import { ProductsTable } from "./components/ProductsTable";
import { ProductFormModal } from "./components/ProductFormModal";

export default function StoreProductsPage() {
  const state = useProducts();
  const {
    products,
    loading,
    deletingId,
    error,
    message,
    activeProducts,
    availableProducts,
    showForm,
    loadProducts,
    openCreateForm,
    openEditForm,
    deleteProduct,
  } = state;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {error && (
        <div className="mb-5 rounded-2xl border border-danger/30 bg-danger-bg px-5 py-4 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 rounded-2xl border border-success/30 bg-success-bg px-5 py-4 text-sm font-medium text-success">
          {message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            إدارة المنتجات
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            أضف منتجات متجرك وتابع حالتها وتوفرها.
          </p>
        </div>

        <Button onClick={openCreateForm}>إضافة منتج</Button>
      </div>

      <ProductsStats
        loading={loading}
        total={products.length}
        active={activeProducts}
        available={availableProducts}
      />

      <ProductsTable
        products={products}
        loading={loading}
        deletingId={deletingId}
        onRefresh={() => void loadProducts()}
        onCreate={openCreateForm}
        onEdit={openEditForm}
        onDelete={(product) => void deleteProduct(product)}
      />

      {showForm && <ProductFormModal state={state} />}
    </div>
  );
}
