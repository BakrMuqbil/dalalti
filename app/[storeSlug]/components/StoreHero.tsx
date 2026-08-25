import Image from "next/image";
import Link from "next/link";

type HeroProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

type Props = {
  storeName: string;
  description: string | null;
  storeSlug: string;
  productCount: number;
  categoryCount: number;
  featuredProduct?: HeroProduct | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(value);
}

export function StoreHero({
  storeName,
  description,
  storeSlug,
  productCount,
  categoryCount,
  featuredProduct,
}: Props) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(circle_at_80%_20%,rgba(184,134,46,0.14),transparent_32%),linear-gradient(135deg,#fffdf9_0%,#f7efe3_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-8 lg:py-16">
        <div className="relative z-10 text-right">
          <span className="inline-flex rounded-full border border-gold-soft bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-deep backdrop-blur">
            تسوّق بثقة • {storeName}
          </span>

          <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            منتجات تستحق أن تكون جزءًا من يومك
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-ink-soft sm:text-lg">
            {description || `اكتشف تشكيلة ${storeName} واختر ما يناسبك بسهولة.`}
          </p>

          <div className="mt-7 flex flex-wrap justify-start gap-3">
            <Link
              href={`/${storeSlug}#products`}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/15 transition hover:-translate-y-0.5 hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              تسوق الآن
            </Link>
            {categoryCount > 0 && (
              <Link
                href={`/${storeSlug}#categories`}
                className="rounded-xl border border-line bg-surface/80 px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:bg-surface focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                استكشف الفئات
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div>
              <strong className="block text-lg text-ink">{productCount}</strong>
              <span className="text-ink-soft">منتج متاح</span>
            </div>
            <div>
              <strong className="block text-lg text-ink">{categoryCount}</strong>
              <span className="text-ink-soft">فئة</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-5 rounded-[2rem] bg-gold-soft/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-surface p-3 shadow-[0_28px_70px_-35px_rgba(43,36,32,0.45)]">
            <div className="relative aspect-[4/4.5] overflow-hidden rounded-[1.5rem] bg-[#eee6d9]">
              {featuredProduct?.imageUrl ? (
                <Image
                  src={featuredProduct.imageUrl}
                  alt={featuredProduct.name}
                  fill
                  priority
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 90vw, 48vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold-soft/30 to-brand/10 p-8 text-center">
                  <span className="font-display text-3xl font-bold text-brand-deep">
                    {storeName}
                  </span>
                </div>
              )}

              {featuredProduct && (
                <Link
                  href={`/${storeSlug}/products/${featuredProduct.id}`}
                  className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/50 bg-surface/90 px-4 py-3 backdrop-blur transition hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{featuredProduct.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">منتج مميز</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-brand-deep">
                    {formatPrice(featuredProduct.price)} ريال
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
