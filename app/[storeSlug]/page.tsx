import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StorefrontHome from "./components/StorefrontHome";

export const dynamic = "force-dynamic";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  const store = await prisma.store.findUnique({
    where: {
      slug: storeSlug,
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
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      products: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          availability: true,
          categoryId: true,
          images: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              imageUrl: true,
              sortOrder: true,
              isPrimary: true,
            },
          },
          variants: {
            where: { availability: "AVAILABLE" },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              color: true,
              size: true,
              price: true,
              availability: true,
            },
          },
        },
      },
    },
  });

  if (!store || store.status !== "ACTIVE") {
    notFound();
  }

  const categories = store.categories.map((category) => ({
    id: category.id,
    name: category.name,
    parentId: category.parentId,
  }));

  const products = store.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    availability: product.availability,
    categoryId: product.categoryId,
    imageUrl:
      product.images.find((image) => image.isPrimary)?.imageUrl ??
      product.images[0]?.imageUrl ??
      null,
    variantCount: product.variants.length,
  }));

  return (
    <StorefrontHome
      store={{
        name: store.name,
        slug: store.slug,
        description: store.description,
        logoUrl: store.logoUrl,
        phone: store.phone,
      }}
      categories={categories}
      products={products}
    />
  );
}
