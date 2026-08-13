import { Button } from "@/components/ui/Button";
import { ImageDraft } from "../types";

interface ProductImagesFieldProps {
  images: ImageDraft[];
  saving: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  onFileSelect: (index: number, file: File) => void;
}

export function ProductImagesField({
  images,
  saving,
  onAdd,
  onRemove,
  onSetPrimary,
  onFileSelect,
}: ProductImagesFieldProps) {
  return (
    <section className="rounded-2xl border border-line p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink">صور المنتج</h3>
          <p className="mt-1 text-xs text-ink-soft">
            ارفع صور المنتج مباشرة من جهازك. سيتم ضغطها وتحويلها تلقائيًا إلى
            WebP لتسريع تحميل المتجر.
          </p>
        </div>

        <Button size="sm" onClick={onAdd} disabled={saving}>
          + إضافة صورة
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <div className="text-4xl">🖼️</div>
          <p className="mt-3 text-sm font-medium text-ink">لا توجد صور للمنتج</p>
          <p className="mt-1 text-xs text-ink-soft">
            اضغط على إضافة صورة لاختيار صورة من جهازك.
          </p>
          <Button className="mt-4" size="sm" onClick={onAdd} disabled={saving}>
            اختيار صورة
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {images.map((image, index) => (
            <div
              key={image.id ?? `new-image-${index}`}
              className="rounded-2xl border border-line bg-background p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface">
                  {image.previewUrl || image.imageUrl ? (
                    <img
                      src={image.previewUrl || image.imageUrl}
                      alt={`صورة ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🖼️</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface px-4 py-4 text-sm font-medium text-ink transition hover:border-gold hover:bg-background ${
                      saving ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      disabled={saving}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onFileSelect(index, file);
                        event.target.value = "";
                      }}
                    />
                    <span>
                      {image.file ? image.file.name : "📁 اختيار صورة من الجهاز"}
                    </span>
                  </label>

                  <div className="mt-2 text-xs text-ink-soft">
                    JPG / PNG / WebP / GIF / AVIF — الحد الأقصى 10MB
                  </div>

                  {image.imageUrl && !image.file && (
                    <div className="mt-2 truncate text-xs text-success">
                      الصورة محفوظة على التخزين
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSetPrimary(index)}
                      disabled={saving}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        image.isPrimary
                          ? "bg-gold-soft/40 text-brand-deep"
                          : "border border-line bg-surface text-ink-soft hover:bg-background"
                      }`}
                    >
                      {image.isPrimary ? "★ الصورة الرئيسية" : "تعيين كرئيسية"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      disabled={saving}
                      className="rounded-lg border border-danger/30 bg-surface px-3 py-2 text-xs font-medium text-danger hover:bg-danger-bg"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
