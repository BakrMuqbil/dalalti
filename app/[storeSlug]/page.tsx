import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { StoreHeader } from "./components/StoreHeader";
import { StoreHero } from "./components/StoreHero";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { StoreFooter } from "./components/StoreFooter";
import { StorefrontWrapper } from "./components/StorefrontWrapper";

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
    where: {
      slug: storeSlug,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      phone: true,
      status: true,
      categories: {
        where: {
          parentId: null,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!store || store.status !== "ACTIVE") {
    notFound();
  }

  // Build product query conditions
  const whereConditions: Array<Record<string, unknown>> = [
    { storeId: store.id, status: "ACTIVE" },
  ];

  if (categoryId) {
    whereConditions.push({ categoryId });
  }

  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  if (availability === "available") {
    whereConditions.push({ availability: "AVAILABLE" });
  }

  // Build orderBy
  const orderBy: { price?: 'asc' | 'desc'; name?: 'asc'; createdAt?: 'desc' } = (() => {
    switch (sort) {
      case "price-asc":
        return { price: "asc" as const };
      case "price-desc":
        return { price: "desc" as const };
      case "name":
        return { name: "asc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const products = await prisma.product.findMany({
    where: { AND: whereConditions },
    orderBy,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      availability: true,
      categoryId: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          imageUrl: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
      variants: {
        select: {
          id: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const categories = store.categories.map((c: { id: string; name: string; imageUrl: string | null }) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl,
  }));

  const productList = products.map((p: typeof products[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toNumber(),
    availability: p.availability,
    images: p.images,
    variants: p.variants,
    category: p.category,
  }));

  return (
    <StorefrontWrapper storeSlug={store.slug}>
      <div className="flex min-h-screen flex-col bg-background">
        <StoreHeader
          storeName={store.name}
          storeSlug={store.slug}
          logoUrl={store.logoUrl}
          phone={store.phone}
          onSearch={() => {}}
        />
        <StoreHero storeName={store.name} description={store.description} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <CategoryFilter
            categories={categories}
            activeCategory={categoryId || null}
            storeSlug={store.slug}
          />
          <ProductFilterBar
            storeSlug={store.slug}
            initialQuery={q || ""}
            initialSort={sort || "newest"}
            initialAvailability={availability || "all"}
          />
          <ProductGrid products={productList} storeSlug={store.slug} />
        </main>
        <StoreFooter storeName={store.name} />
      </div>
    </StorefrontWrapper>
  );
}
