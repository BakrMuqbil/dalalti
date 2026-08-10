"use client";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    availability: "AVAILABLE" | "UNAVAILABLE";
    imageUrl: string | null;
    variantCount: number;
  };
  categoryName?: string;
};

function formatPrice(value: string) {
  return new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-1 hover:border-gold hover:shadow-[0_16px_32px_-20px_rgba(184,134,46,0.45)]">
      <a href={`#product-${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#eee6d9]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">
              لا توجد صورة
            </div>
          )}

          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
              product.availability === "AVAILABLE"
                ? "bg-success-bg text-success"
                : "bg-danger-bg text-danger"
            }`}
          >
            {product.availability === "AVAILABLE" ? "متوفر" : "غير متوفر"}
          </span>
        </div>

        <div className="p-4">
          {categoryName && (
            <p className="mb-1 text-xs font-medium text-gold">{categoryName}</p>
          )}
          <h3 className="line-clamp-2 text-[15px] font-semibold text-ink">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-ink-soft">
              {product.description}
            </p>
          )}

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-base font-medium text-ink">
                {formatPrice(product.price)}
              </span>
              <span className="mr-1 text-[11px] text-ink-soft">ريال يمني</span>
            </div>
            {product.variantCount > 0 && (
              <span className="text-[11px] text-ink-soft">
                خيارات متعددة
              </span>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}
