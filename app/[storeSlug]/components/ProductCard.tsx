'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { PlusIcon } from '@/components/icons';
import { QuickViewButton } from './QuickView';

type Props = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    availability: 'AVAILABLE' | 'UNAVAILABLE';
    images: { imageUrl: string; isPrimary: boolean }[];
    variants: { id: string }[];
    category: { id: string; name: string } | null;
  };
  storeSlug: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('ar-YE', { maximumFractionDigits: 0 }).format(value);
}

export function ProductCard({ product, storeSlug }: Props) {
  const { addItem } = useCart();
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.imageUrl ?? null;
  const variantCount = product.variants.length;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.availability !== 'AVAILABLE') return;

    if (variantCount > 0) {
      window.location.href = `/${storeSlug}/products/${product.id}`;
      return;
    }

    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: product.price,
      imageUrl,
      storeSlug,
      variantLabel: null,
    });
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_18px_40px_-24px_rgba(43,36,32,0.35)]">
      <div className="relative">
        <Link href={`/${storeSlug}/products/${product.id}`} className="block" aria-label={`${product.name} — ${formatPrice(product.price)} ريال يمني`}>
          <div className="relative aspect-[4/5] overflow-hidden bg-[#eee6d9]">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-soft">لا توجد صورة</div>
            )}
            <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
              product.availability === 'AVAILABLE'
                ? 'bg-success-bg/95 text-success'
                : 'bg-danger-bg/95 text-danger'
            }`}>
              {product.availability === 'AVAILABLE' ? 'متوفر' : 'غير متوفر'}
            </span>
          </div>

          <div className="p-3.5 sm:p-4">
            {product.category && <p className="mb-1 text-[11px] font-semibold text-gold">{product.category.name}</p>}
            <h3 className="min-h-[2.75rem] line-clamp-2 text-[14px] font-semibold leading-6 text-ink sm:text-[15px]">
              {product.name}
            </h3>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-[15px] font-bold text-ink sm:text-base">{formatPrice(product.price)}</span>
                <span className="ms-1 text-[10px] text-ink-soft">ريال</span>
              </div>
              {variantCount > 0 && (
                <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-medium text-ink-soft">
                  خيارات
                </span>
              )}
            </div>
          </div>
        </Link>

        <QuickViewButton product={product} storeSlug={storeSlug} />

        {product.availability === 'AVAILABLE' && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 transition-all hover:scale-105 hover:bg-brand-deep active:scale-95 sm:bottom-4 sm:left-4"
            aria-label={variantCount > 0 ? 'اختيار خيارات المنتج' : 'إضافة المنتج إلى السلة'}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </article>
  );
}
