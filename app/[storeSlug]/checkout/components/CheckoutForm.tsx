"use client";

import { useState } from "react";
import { useCart } from "../../components/CartProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeftIcon, PackageCheckIcon } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = { storeSlug: string; storeName: string };

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(value);
}

export function CheckoutForm({ storeSlug, storeName }: Props) {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", city: "", area: "", address: "", shippingNotes: "", notes: "",
  });

  const setField = (field: keyof typeof formData, value: string) =>
    setFormData((current) => ({ ...current, [field]: value }));

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
          <EmptyState
            icon={<PackageCheckIcon className="h-12 w-12 text-ink-soft" />}
            title="السلة فارغة"
            description="لم تضيفي أي منتجات للسلة. تصفحي المتجر واختاري منتجاتك المفضلة."
          >
            <Link href={`/${storeSlug}`}><Button variant="primary">العودة للمتجر</Button></Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/public/stores/${storeSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          shippingCity: formData.city,
          shippingArea: formData.area,
          shippingAddress: formData.address,
          shippingNotes: formData.shippingNotes,
          deliveryMethod: "DELIVERY",
          paymentMethod: "CASH_ON_DELIVERY",
          notes: formData.notes,
          items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "حدث خطأ أثناء إنشاء الطلب");

      clearCart();
      router.push(`/${storeSlug}/checkout/confirmation?order=${data.data.order.id}&token=${encodeURIComponent(data.data.order.accessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6" aria-label="التنقل">
          <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-brand">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden /> العودة للمتجر
          </Link>
        </nav>

        <div className="mb-8">
          <p className="text-sm font-medium text-brand">{storeName}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">إتمام الطلب</h1>
          <p className="mt-2 text-sm text-ink-soft">أكملي بياناتك لإرسال الطلب إلى المتجر.</p>
        </div>

        {error && <div role="alert" className="mb-6 rounded-xl border border-danger bg-danger-bg p-4 text-sm text-danger">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">معلومات العميل</h2>
                <p className="mt-1 text-xs text-ink-soft">البيانات المطلوبة للتواصل وتأكيد الطلب.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input label="الاسم الكامل" value={formData.name} onChange={(e) => setField("name", e.target.value)} placeholder="أدخلي اسمك الكامل" required />
                  <Input label="رقم الهاتف" value={formData.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="مثال: 967700000000" inputMode="tel" required />
                  <div className="sm:col-span-2"><Input label="البريد الإلكتروني (اختياري)" type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)} placeholder="example@email.com" /></div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">عنوان التوصيل</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input label="المحافظة / المدينة" value={formData.city} onChange={(e) => setField("city", e.target.value)} placeholder="مثال: عدن" required />
                  <Input label="المنطقة / الحي" value={formData.area} onChange={(e) => setField("area", e.target.value)} placeholder="مثال: المنصورة" required />
                  <div className="sm:col-span-2"><Input label="العنوان بالتفصيل" value={formData.address} onChange={(e) => setField("address", e.target.value)} placeholder="الشارع، بجانب..., رقم المنزل..." required /></div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-ink">ملاحظات العنوان (اختياري)</label>
                    <textarea value={formData.shippingNotes} onChange={(e) => setField("shippingNotes", e.target.value)} rows={3} placeholder="علامة مميزة، وقت مناسب للتوصيل..." className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/15" />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">طريقة الاستلام والدفع</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-brand bg-brand/5 p-4" role="status">
                    <span className="block text-sm font-semibold text-ink">التوصيل إلى العنوان</span>
                    <span className="mt-1 block text-xs text-ink-soft">خيار التوصيل المتاح حاليًا.</span>
                  </div>
                  <div className="rounded-xl border border-brand bg-brand/5 p-4" role="status">
                    <span className="block text-sm font-semibold text-ink">الدفع عند الاستلام</span>
                    <span className="mt-1 block text-xs text-ink-soft">لا توجد بوابة دفع إلكترونية مفعلة حاليًا.</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">ملاحظات الطلب</h2>
                <textarea value={formData.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} placeholder="أي ملاحظات إضافية للمتجر..." className="mt-4 w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/15" />
              </section>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "جاري إرسال الطلب..." : "تأكيد وإرسال الطلب"}
              </Button>
            </form>
          </div>

          <aside className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">ملخص الطلب</h2>
              <ul className="mt-5 space-y-4">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.variantId ?? "base"}`} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eee6d9]">
                      {item.imageUrl ? <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" /> : <div className="flex h-full items-center justify-center text-xs text-ink-soft">لا صورة</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-ink">{item.name}</p>
                      {item.variantLabel && <p className="text-xs text-ink-soft">{item.variantLabel}</p>}
                      <p className="text-xs text-ink-soft">الكمية: {item.quantity}</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-medium text-ink">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                <div className="flex justify-between text-sm"><span className="text-ink-soft">المجموع الفرعي</span><span className="font-medium text-ink">{formatPrice(total)} ريال</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-soft">رسوم التوصيل</span><span className="font-medium text-ink">0 ريال</span></div>
                <div className="flex items-center justify-between border-t border-line pt-3"><span className="font-semibold text-ink">الإجمالي</span><span className="font-display text-xl font-bold text-ink">{formatPrice(total)} <span className="text-sm font-normal text-ink-soft">ريال يمني</span></span></div>
                <p className="text-xs leading-5 text-ink-soft">السعر النهائي يُعاد التحقق منه من الخادم عند إرسال الطلب.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
