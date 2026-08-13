"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  categoryId: string | null;
  imageUrl: string | null;
  variantCount: number;
};

type Props = {
  store: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    phone: string | null;
  };
  categories: Category[];
  products: Product[];
};

function whatsappUrl(phone: string | null, storeName: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `مرحباً ${storeName}، أريد الاستفسار عن منتجات المتجر.`,
  )}`;
}

export default function StorefrontHome({ store, categories, products }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.categoryId === activeCategory;

      const haystack = `${product.name} ${product.description ?? ""}`.toLocaleLowerCase(
        "ar",
      );
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  const whatsapp = whatsappUrl(store.phone, store.name);

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href={`/${store.slug}`} className="flex min-w-0 items-center gap-3">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-10 w-10 rounded-xl border border-line object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 rotate-45 items-center justify-center rounded-[10px] bg-gold">
                <span className="-rotate-45 text-xs font-bold text-white">د</span>
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold text-ink">
                {store.name}
              </div>
              <div className="text-[11px] text-ink-soft">متجر على دلالتي</div>
            </div>
          </a>

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-medium text-white transition hover:bg-whatsapp-deep"
            >
              تواصل عبر واتساب
            </a>
          )}
        </div>
      </header>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_360px] lg:items-end lg:py-20">
          <div>
            <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
              متجر خاص
            </span>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.25] tracking-tight text-ink sm:text-5xl">
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
                {store.description}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-background p-5">
            <p className="text-sm font-semibold text-ink">ابحثي في المنتجات</p>
            <div className="mt-3 flex items-center rounded-xl border border-line bg-surface px-3 focus-within:border-gold">
              <span className="text-ink-soft">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="اسم المنتج أو الوصف"
                className="w-full bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
              التصنيفات
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink">تصفحي حسب ذوقك</h2>
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                activeCategory === "all"
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink-soft hover:border-brand hover:text-ink"
              }`}
            >
              الكل
            </button>
            {categories
              .filter((category) => !category.parentId)
              .map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    activeCategory === category.id
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-ink-soft hover:border-brand hover:text-ink"
                  }`}
                >
                  {category.name}
                </button>
              ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="font-semibold text-ink">لا توجد منتجات مطابقة</p>
            <p className="mt-2 text-sm text-ink-soft">
              جربي تغيير البحث أو اختيار تصنيف آخر.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={
                  product.categoryId ? categoryNames.get(product.categoryId) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-ink-soft sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <p>متجر {store.name}</p>
          <p>مدعوم بواسطة دلالتي</p>
        </div>
      </footer>
    </main>
  );
}
