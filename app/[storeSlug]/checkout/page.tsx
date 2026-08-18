import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckoutForm } from './components/CheckoutForm';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ storeSlug: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { storeSlug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug, status: 'ACTIVE' },
    select: { id: true, name: true, slug: true, logoUrl: true, phone: true },
  });

  if (!store) {
    notFound();
  }

  return (
    <>
      <StoreHeader
        storeName={store.name}
        storeSlug={store.slug}
        logoUrl={store.logoUrl}
        phone={store.phone}
      />
      <CheckoutForm storeSlug={store.slug} storeName={store.name} />
      <StoreFooter storeName={store.name} />
    </>
  );
}
