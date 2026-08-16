/* ============================================================
   Metadata utilities for SEO & OpenGraph
   ============================================================ */

import type { Metadata } from 'next';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dalalti.com';

export function getBaseUrl(): string {
  return DEFAULT_BASE_URL;
}

export function buildCanonicalUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
}

interface StoreMetaInput {
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  slug: string;
}

export function buildStoreMetadata({ storeName, description, logoUrl, slug }: StoreMetaInput): Metadata {
  const title = `${storeName} | دلالتي`;
  const desc = description || `تصفح منتجات ${storeName} على دلالتي`;
  const url = buildCanonicalUrl(slug);
  const images = logoUrl ? [{ url: logoUrl, width: 512, height: 512, alt: storeName }] : undefined;

  return {
    title,
    description: desc,
    metadataBase: new URL(getBaseUrl()),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: 'دلالتي',
      locale: 'ar_YE',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: images?.map((img) => img.url),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

interface ProductMetaInput {
  productName: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  storeName: string;
  storeSlug: string;
  productId: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
}

export function buildProductMetadata({
  productName,
  description,
  imageUrl,
  price,
  storeName,
  storeSlug,
  productId,
  availability,
}: ProductMetaInput): Metadata {
  const title = `${productName} | ${storeName}`;
  const desc = description || `تفاصيل ${productName} من ${storeName}`;
  const url = buildCanonicalUrl(`${storeSlug}/products/${productId}`);
  const images = imageUrl ? [{ url: imageUrl, width: 800, height: 1200, alt: productName }] : undefined;

  return {
    title,
    description: desc,
    metadataBase: new URL(getBaseUrl()),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: storeName,
      locale: 'ar_YE',
      type: 'product',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: images?.map((img) => img.url),
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'product:price:amount': price.toString(),
      'product:price:currency': 'YER',
      'product:availability': availability === 'AVAILABLE' ? 'in stock' : 'out of stock',
    },
  };
}

/* ============================================================
   JSON-LD Structured Data
   ============================================================ */

interface ProductJsonLdInput {
  productName: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  storeName: string;
  storeSlug: string;
  productId: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  categoryName?: string | null;
}

export function buildProductJsonLd({
  productName,
  description,
  imageUrl,
  price,
  storeName,
  storeSlug,
  productId,
  availability,
  categoryName,
}: ProductJsonLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: description || undefined,
    image: imageUrl || undefined,
    sku: productId,
    brand: {
      '@type': 'Brand',
      name: storeName,
    },
    category: categoryName || undefined,
    offers: {
      '@type': 'Offer',
      url: buildCanonicalUrl(`${storeSlug}/products/${productId}`),
      priceCurrency: 'YER',
      price: price.toString(),
      availability: availability === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName,
      },
    },
  };
}

interface StoreJsonLdInput {
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  slug: string;
  phone: string | null;
}

export function buildStoreJsonLd({ storeName, description, logoUrl, slug, phone }: StoreJsonLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeName,
    description: description || undefined,
    image: logoUrl || undefined,
    url: buildCanonicalUrl(slug),
    telephone: phone || undefined,
    '@id': buildCanonicalUrl(slug),
  };
}
