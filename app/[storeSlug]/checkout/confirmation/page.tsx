import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ReceiptIcon, ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ order?: string; token?: string }> };
function formatPrice(value: number) { return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(value); }

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const { order: orderId, token } = await searchParams;
  if (!orderId || !token) notFound();

  const store = await prisma.store.findUnique({ where: { slug: storeSlug, status: "ACTIVE" }, select: { id: true, name: true, phone: true } });
  if (!store) notFound();

  const tokenRows = await prisma.$queryRaw<Array<{ public_access_token: string | null }>>`
    SELECT public_access_token FROM orders WHERE id = ${orderId}::uuid AND store_id = ${store.id}::uuid LIMIT 1
  `;
  if (!tokenRows[0]?.public_access_token || tokenRows[0].public_access_token !== token) notFound();

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: { items: { include: { product: { select: { name: true } }, variant: { select: { color: true, size: true } } } }, customer: true },
  });
  if (!order) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <EmptyState icon={<ReceiptIcon className="h-12 w-12 text-success" />} title="تم استلام طلبك بنجاح" description={`شكراً لثقتك بـ ${store.name}. سنقوم بالتواصل معك قريباً لتأكيد الطلب.`}>
          <div className="w-full max-w-md space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6 text-right">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-4"><span className="text-sm text-ink-soft">رقم الطلب</span><span className="font-mono text-lg font-bold text-brand">#DL-{order.id.slice(0, 8).toUpperCase()}</span></div>
              <div className="mb-5 grid gap-3 rounded-xl bg-background p-4 text-sm"><div><span className="text-ink-soft">الاستلام:</span> <strong>التوصيل إلى العنوان</strong></div><div><span className="text-ink-soft">الدفع:</span> <strong>الدفع عند الاستلام</strong></div><div><span className="text-ink-soft">العنوان:</span> <strong>{order.customer.address || "—"}</strong></div></div>
              <div className="space-y-3">{order.items.map((item) => <div key={item.id} className="flex items-center justify-between"><div><p className="text-sm font-medium text-ink">{item.product.name}</p>{[item.variant?.color, item.variant?.size].filter(Boolean).length > 0 && <p className="text-xs text-ink-soft">{[item.variant?.color, item.variant?.size].filter(Boolean).join(" / ")}</p>}<p className="text-xs text-ink-soft">الكمية: {item.quantity}</p></div><span className="font-mono text-sm font-medium text-ink">{formatPrice(Number(item.unitPrice.toString()) * item.quantity)} ريال</span></div>)}</div>
              <div className="mt-4 border-t border-line pt-4"><div className="flex items-center justify-between"><span className="text-sm text-ink-soft">الإجمالي</span><span className="font-display text-xl font-bold text-ink">{formatPrice(Number(order.totalAmount))} <span className="text-sm font-normal text-ink-soft">ريال يمني</span></span></div></div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row"><Link href={`/${storeSlug}`} className="flex-1"><Button variant="primary" className="w-full"><ArrowLeftIcon className="me-2 h-4 w-4" aria-hidden />العودة للمتجر</Button></Link>{store.phone && <a href={`https://wa.me/${store.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1"><Button variant="whatsapp" className="w-full">تواصل عبر واتساب</Button></a>}</div>
          </div>
        </EmptyState>
      </div>
    </div>
  );
}
