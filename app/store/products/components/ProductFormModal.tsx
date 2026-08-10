import { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ProductBasicFields } from "./ProductBasicFields";
import { ProductImagesField } from "./ProductImagesField";
import { ProductVariantsField } from "./ProductVariantsField";
import { useProducts } from "../hooks/useProducts";

type UseProductsReturn = ReturnType<typeof useProducts>;

interface ProductFormModalProps {
  state: UseProductsReturn;
}

export function ProductFormModal({ state }: ProductFormModalProps) {
  const {
    editingProduct,
    form,
    setForm,
    categories,
    saving,
    images,
    variants,
    closeForm,
    submitProduct,
    addImage,
    updateImage,
    removeImage,
    setPrimaryImage,
    handleImageFile,
    addVariant,
    updateVariant,
    removeVariant,
  } = state;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitProduct();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              {editingProduct ? "تعديل المنتج" : "إضافة منتج"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              البيانات والصور والمتغيرات في نموذج واحد
            </p>
          </div>

          <button
            type="button"
            onClick={closeForm}
            disabled={saving}
            className="rounded-lg px-3 py-2 text-ink-soft hover:bg-background"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 p-6">
          <ProductBasicFields
            form={form}
            categories={categories}
            saving={saving}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />

          <ProductImagesField
            images={images}
            saving={saving}
            onAdd={addImage}
            onRemove={removeImage}
            onSetPrimary={setPrimaryImage}
            onFileSelect={handleImageFile}
          />

          <ProductVariantsField
            variants={variants}
            saving={saving}
            onAdd={addVariant}
            onRemove={removeVariant}
            onChange={updateVariant}
          />

          <div className="sticky bottom-0 flex gap-3 border-t border-line bg-surface pt-5">
            <Button type="submit" loading={saving} className="flex-1" size="lg">
              {saving
                ? "جاري حفظ المنتج وخصائصه..."
                : editingProduct
                  ? "حفظ المنتج والتعديلات"
                  : "إنشاء المنتج"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={closeForm}
              disabled={saving}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
