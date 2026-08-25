import Image from "next/image";
import Link from "next/link";

type Category = { id: string; name: string; imageUrl: string | null };

type Props = {
  categories: Category[];
  activeCategory: string | null;
  storeSlug: string;
};

export function CategoryFilter({ categories, activeCategory, storeSlug }: Props) {
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="mb-12 scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold">اكتشف التشكيلة</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">تسوق حسب الفئة</h2>
        </div>
        <Link href={`/${storeSlug}`} className="text-sm font-semibold text-brand hover:text-brand-deep">
          كل المنتجات
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
        <Link
          href={`/${storeSlug}`}
          className={`group relative min-w-[150px] flex-1 snap-start overflow-hidden rounded-2xl border transition sm:min-w-0 ${
            activeCategory === null ? "border-brand ring-2 ring-brand/10" : "border-line hover:border-gold"
          }`}
        >
          <div className="relative aspect-[1.15] bg-gradient-to-br from-brand to-brand-deep">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">كل المنتجات</span>
            </div>
          </div>
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${storeSlug}?category=${cat.id}#products`}
            className={`group relative min-w-[150px] flex-1 snap-start overflow-hidden rounded-2xl border bg-surface transition sm:min-w-0 ${
              activeCategory === cat.id ? "border-brand ring-2 ring-brand/10" : "border-line hover:-translate-y-0.5 hover:border-gold"
            }`}
            aria-current={activeCategory === cat.id ? "page" : undefined}
          >
            <div className="relative aspect-[1.15] overflow-hidden bg-[#eee6d9]">
              {cat.imageUrl ? (
                <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="180px" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-soft">لا توجد صورة</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
                <span className="text-sm font-bold text-white">{cat.name}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
