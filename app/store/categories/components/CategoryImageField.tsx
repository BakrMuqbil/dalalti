"use client";

interface CategoryImageFieldProps {
  imageUrl: string;
  previewUrl?: string;
  file?: File;
  saving: boolean;
  required?: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export function CategoryImageField({
  imageUrl,
  previewUrl,
  file,
  saving,
  required = false,
  onFileSelect,
  onRemove,
}: CategoryImageFieldProps) {
  const displayedImage = previewUrl || imageUrl;

  return (
    <section className="rounded-2xl border border-line p-5">
      <div className="mb-5">
        <h3 className="font-display font-semibold text-ink">
          صورة الفئة
          {required && (
            <span className="mr-1 text-danger">*</span>
          )}
        </h3>

        <p className="mt-1 text-xs text-ink-soft">
          ارفع صورة الفئة من جهازك. سيتم تخزينها في نفس التخزين المستخدم
          لصور المنتجات.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-background">
          {displayedImage ? (
            <img
              src={displayedImage}
              alt="معاينة صورة الفئة"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-4xl">🖼️</div>

              <p className="mt-2 text-sm font-medium text-ink">
                لا توجد صورة
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                اختر صورة من جهازك
              </p>
            </div>
          )}
        </div>

        <label
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface px-4 py-4 text-sm font-medium text-ink transition hover:border-gold hover:bg-background ${
            saving
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            disabled={saving}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];

              if (selectedFile) {
                onFileSelect(selectedFile);
              }

              event.target.value = "";
            }}
          />

          <span>
            {file
              ? file.name
              : "📁 اختيار صورة من الجهاز"}
          </span>
        </label>

        <div className="text-xs text-ink-soft">
          JPG / PNG / WebP / GIF / AVIF — الحد الأقصى 10MB
        </div>

        {imageUrl && !file && (
          <div className="rounded-xl border border-success/20 bg-success-bg px-4 py-3 text-xs text-success">
            الصورة محفوظة على التخزين
          </div>
        )}

        {file && (
          <div className="rounded-xl border border-gold/20 bg-gold-soft/20 px-4 py-3 text-xs text-brand-deep">
            صورة جديدة جاهزة للرفع
          </div>
        )}

        {(displayedImage || file) && (
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="w-full rounded-xl border border-danger/30 bg-surface px-4 py-3 text-xs font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            إزالة الصورة
          </button>
        )}
      </div>
    </section>
  );
}