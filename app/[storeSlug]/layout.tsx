import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildStoreMetadata, buildStoreJsonLd } from '@/lib/metadata';
import { ReactNode } from 'react';
import { StorefrontWrapper } from './components/StorefrontWrapper';

type Props = {
  params: Promise<{ storeSlug: string }>;
  children: ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug, status: 'ACTIVE' },
    select: { name: true, description: true, logoUrl: true, slug: true, phone: true },
  });

  if (!store) {
    return {
      title: 'المتجر غير موجود | دلالتي',
      description: 'المتجر المطلوب غير متوفر حالياً.',
      robots: { index: false, follow: false },
    };
  }

  return buildStoreMetadata({
    storeName: store.name,
    description: store.description,
    logoUrl: store.logoUrl,
    slug: store.slug,
  });
}

/**
 * Layout مشترك لكل صفحات /[storeSlug]/* (الرئيسية، المنتج، السلة/checkout، الحساب).
 *
 * لماذا StorefrontWrapper (وبداخله CartProvider) انتقل إلى هنا:
 * سابقًا كانت كل صفحة (page.tsx, products/[productId]/page.tsx,
 * checkout/page.tsx, account/*) تستدعي <StorefrontWrapper> بشكل مستقل.
 * بما أن Next.js App Router يفكك شجرة React بالكامل عند التنقل بين
 * مسارات page.tsx مختلفة، كان CartProvider يُعاد إنشاؤه من الصفر في كل
 * صفحة. هذا فتح فرصة لحالة سباق (race condition) بين قراءة السلة من
 * localStorage (hydrate) وكتابتها إليه (persist) عند كل تنقل — وتحديدًا
 * عند الانتقال من صفحة المنتج إلى /checkout، ما قد يمسح بيانات السلة قبل
 * أن تُقرأ فعليًا، فتظهر صفحة Checkout وكأن السلة فارغة رغم إضافة منتجات.
 *
 * وضع Provider واحد هنا (على مستوى الـ layout) يضمن بقاءه حيًا وثابتًا
 * طوال تنقل الزائر داخل نفس المتجر، دون إعادة إنشاء أو فقدان حالة.
 */
export default async function StoreLayout({ params, children }: Props) {
  const { storeSlug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug, status: 'ACTIVE' },
    select: { id: true, name: true, description: true, logoUrl: true, slug: true, phone: true },
  });

  if (!store) {
    notFound();
  }

  const jsonLd = buildStoreJsonLd({
    storeName: store.name,
    description: store.description,
    logoUrl: store.logoUrl,
    slug: store.slug,
    phone: store.phone,
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontWrapper storeSlug={store.slug}>{children}</StorefrontWrapper>
    </div>
  );
}