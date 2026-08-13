import { Input, Select, Textarea } from "@/components/ui/Input";
import { Category, ProductFormValues } from "../types";

interface ProductBasicFieldsProps {
  form: ProductFormValues;
  categories: Category[];
  saving: boolean;
  onChange: (patch: Partial<ProductFormValues>) => void;
}

export function ProductBasicFields({
  form,
  categories,
  saving,
  onChange,
}: ProductBasicFieldsProps) {
  return (
    <section className="rounded-2xl border border-line p-5">
      <h3 className="mb-5 font-display font-semibold text-ink">
        المعلومات الأساسية
      </h3>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          htmlFor="product-name"
          label="اسم المنتج"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={saving}
          placeholder="مثال: عباية تطريز يدوي"
        />

        <Select
          htmlFor="product-category"
          label="التصنيف"
          value={form.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          disabled={saving}
        >
          <option value="">بدون تصنيف</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5">
        <Textarea
          htmlFor="product-description"
          label="الوصف"
          rows={4}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={saving}
          placeholder="وصف مختصر للمنتج..."
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Input
          htmlFor="product-price"
          label="السعر الأساسي"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => onChange({ price: e.target.value })}
          disabled={saving}
          placeholder="0.00"
        />

        <Select
          htmlFor="product-availability"
          label="التوفر"
          value={form.availability}
          onChange={(e) =>
            onChange({
              availability: e.target.value as ProductFormValues["availability"],
            })
          }
          disabled={saving}
        >
          <option value="AVAILABLE">متوفر</option>
          <option value="UNAVAILABLE">غير متوفر</option>
        </Select>

        <Select
          htmlFor="product-status"
          label="الحالة"
          value={form.status}
          onChange={(e) =>
            onChange({ status: e.target.value as ProductFormValues["status"] })
          }
          disabled={saving}
        >
          <option value="ACTIVE">نشط</option>
          <option value="INACTIVE">غير نشط</option>
        </Select>
      </div>
    </section>
  );
}
