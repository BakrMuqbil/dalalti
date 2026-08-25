import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { StoreHeader } from "./components/StoreHeader";
import { StoreHero } from "./components/StoreHero";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { StoreFooter } from "./components/StoreFooter";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    availability?: string;
  }>;
};

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const { category: categoryId, q, sort, availability } = await searchParams;

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug, status: "ACTIVE" },
    select: {
      id: true, name: true, slug: true, description: true, logoUrl: true, phone: true, status: true,
      categories: {
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true },
      },
    },
  });

  if (!store || store.status !== "ACTIVE") notFound();

  const whereConditions: Array<Record<string, unknown>> = [{ storeId: store.id, status: "ACTIVE" }];
  if (categoryId) whereConditions.push({ categoryId });
  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }
  if (availability === "available") whereConditions.push({ availability: "AVAILABLE" });

  const orderBy: { price?: "asc" | "desc"; name?: "asc"; createdAt?: "desc" } = (() => {
    switch (sort) {
      case "price-asc": return { price: "asc" };
      case "price-desc": return { price: "desc" };
      case "name": return { name: "asc" };
      default: return { createdAt: "desc" };
    }
  })();

  const products = await prisma.product.findMany({
    where: { AND: whereConditions },
    orderBy,
    select: {
      id: true, name: true, description: true, price: true, availability: true, categoryId: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true },
      },
      variants: { select: { id: true } },
      category: { select: { id: true, name: true } },
    },
  });

  const productList = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toNumber(),
    availability: p.availability,
    images: p.images,
    variants: p.variants,
    category: p.category,
  }));

  const categories = store.categories.map((c) => ({ id: c.id, name: c.name, imageUrl: c.imageUrl }));
  const heroProduct = productList[0];
  const hasDiscoveryFilters = Boolean(categoryId || q || availability);
  const showLatest = !hasDiscoveryFilters && productList.length >= 8;
  const latestProducts = showLatest ? productList.slice(0, 4) : [];
  const discoveryProducts = showLatest ? productList.slice(4) : productList;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader storeName={store.name} storeSlug={store.slug} logoUrl={store.logoUrl} phone={store.phone} />

      <StoreHero
        storeName={store.name}
        description={store.description}
        storeSlug={store.slug}
        productCount={productList.length}
        categoryCount={categories.length}
        featuredProduct={heroProduct ? {
          id: heroProduct.id,
          name: heroProduct.name,
          price: heroProduct.price,
          imageUrl: heroProduct.images[0]?.imageUrl ?? null,
        } : null}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <CategoryFilter categories={categories} activeCategory={categoryId || null} storeSlug={store.slug} />

        {showLatest && (
          <section className="mb-14" aria-labelledby="latest-heading">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-gold">اختيار سريع</p>
                <h2 id="latest-heading" className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">وصل حديثًا</h2>
              </div>
              <a href="#products" className="text-sm font-semibold text-brand hover:text-brand-deep">استكشف الكل</a>
            </div>
            <ProductGrid products={latestProducts} storeSlug={store.slug} />
          </section>
        )}

        <ProductFilterBar
          storeSlug={store.slug}
          initialQuery={q || ""}
          initialSort={sort || "newest"}
          initialAvailability={availability || "all"}
          productCount={discoveryProducts.length}
        />
        <ProductGrid products={discoveryProducts} storeSlug={store.slug} />
      </main>

      <StoreFooter storeName={store.name} storeSlug={store.slug} phone={store.phone} />
    </div>
  );
}
