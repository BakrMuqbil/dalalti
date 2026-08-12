"use client";

import { CategoryImageField } from "./components/CategoryImageField";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { Category, useCategories } from "./hooks/useCategories";

export default function StoreCategoriesPage() {
  const {
    categories,
    loading,
    saving,
    name,
    parentId,
    imageUrl,
    imageFile,
    imagePreviewUrl,
    editingId,
    setName,
    setParentId,
    rootCategories,
    getChildren,
    loadCategories,
    resetForm,
    handleImageFile,
    removeImage,
    handleSubmit,
    startEditing,
    handleDelete,
  } = useCategories();

  function renderCategory(category: Category, level = 0): React.ReactNode {
    const children = getChildren(category.id);

    return (
      <div key={category.id}>
        <div
          className="flex items-center justify-between gap-4 border-b border-line px-5 py-4"
          style={{
            paddingRight: `${20 + level * 32}px`,
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-background">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xl">
                  🖼️
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {level > 0 && <span className="text-ink-soft">↳</span>}

                <span
                  className={
                    level === 0
                      ? "font-bold text-ink"
                      : "font-medium text-ink-soft"
                  }
                >
                  {category.name}
                </span>
              </div>

              <div className="mt-1 flex gap-3 text-xs text-ink-soft">
                <span>{category._count?.products ?? 0} منتج</span>

                <span>{category._count?.children ?? children.length} فرعي</span>

                {!category.imageUrl && (
                  <span className="text-danger">بدون صورة</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => startEditing(category)}
              disabled={saving}
              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-background disabled:opacity-50"
            >
              تعديل
            </button>

            <button
              type="button"
              onClick={() => void handleDelete(category)}
              disabled={saving}
              className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
            >
              حذف
            </button>
          </div>
        </div>

        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          إدارة الفئات
        </h1>

        <p className="mt-1 text-sm text-ink-soft">
          تنظيم منتجات متجرك بفئات رئيسية وفرعية مع صورة لكل فئة.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="h-fit rounded-3xl border border-line bg-surface p-6">
          <div className="mb-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
              {editingId ? "تعديل الفئة" : "فئة جديدة"}
            </span>

            <h2 className="mt-2 font-display text-xl font-semibold text-ink">
              {editingId ? "تحديث بيانات الفئة" : "إضافة فئة"}
            </h2>

            <p className="mt-1 text-sm text-ink-soft">
              الصورة جزء أساسي من هوية الفئة وتستخدم لاحقًا في واجهة المتجر.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="category-name"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                اسم الفئة
              </label>

              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={saving}
                placeholder="مثال: هواتف"
                className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:bg-surface"
              />
            </div>

            {!editingId && (
              <div>
                <label
                  htmlFor="parent-category"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  الفئة الرئيسية
                </label>

                <select
                  id="parent-category"
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:bg-surface"
                >
                  <option value="">فئة رئيسية</option>

                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <CategoryImageField
              imageUrl={imageUrl}
              previewUrl={imagePreviewUrl}
              file={imageFile}
              saving={saving}
              required
              onFileSelect={handleImageFile}
              onRemove={removeImage}
            />

            <div className="flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-background disabled:opacity-50"
                >
                  إلغاء
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingId
                    ? "حفظ التعديلات"
                    : "إضافة الفئة"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="font-display font-semibold text-ink">
                فئات المتجر
              </h2>

              <p className="mt-1 text-sm text-ink-soft">
                {categories.length} فئة
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadCategories()}
              disabled={loading || saving}
              className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-background disabled:opacity-50"
            >
              تحديث
            </button>
          </div>

          {loading ? (
            <Spinner label="جاري تحميل الفئات..." />
          ) : rootCategories.length === 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🗂️</span>}
              title="لا توجد فئات"
              description="أضف أول فئة مع صورتها من النموذج."
            />
          ) : (
            <div>
              {rootCategories.map((category) => renderCategory(category))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
