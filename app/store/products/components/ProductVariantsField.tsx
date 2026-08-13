import { Button } from "@/components/ui/Button";
import { VariantDraft } from "../types";

interface ProductVariantsFieldProps {
  variants: VariantDraft[];
  saving: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<VariantDraft>) => void;
}

export function ProductVariantsField({
  variants,
  saving,
  onAdd,
  onRemove,
  onChange,
}: ProductVariantsFieldProps) {
  return (
    <section className="rounded-2xl border border-line p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink">المتغيرات</h3>
          <p className="mt-1 text-xs text-ink-soft">
            مثل اللون والمقاس والسعر والتوفر
          </p>
        </div>

        <Button size="sm" onClick={onAdd} disabled={saving}>
          + إضافة متغير
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">
          لا توجد متغيرات لهذا المنتج.
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-variant-${index}`}
              className="rounded-2xl border border-line bg-background p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">
                  المتغير #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={saving}
                  className="rounded-lg border border-danger/30 bg-surface px-3 py-2 text-xs font-medium text-danger hover:bg-danger-bg"
                >
                  حذف
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e) => onChange(index, { color: e.target.value })}
                  disabled={saving}
                  placeholder="اللون"
                  className="rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
                />

                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => onChange(index, { size: e.target.value })}
                  disabled={saving}
                  placeholder="المقاس"
                  className="rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => onChange(index, { price: e.target.value })}
                  disabled={saving}
                  placeholder="السعر الخاص"
                  className="rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
                />

                <select
                  value={variant.availability}
                  onChange={(e) =>
                    onChange(index, {
                      availability: e.target.value as VariantDraft["availability"],
                    })
                  }
                  disabled={saving}
                  className="rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/15"
                >
                  <option value="AVAILABLE">متوفر</option>
                  <option value="UNAVAILABLE">غير متوفر</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
