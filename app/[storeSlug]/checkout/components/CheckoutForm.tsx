"use client";
import { useState } from "react";
import { useCart } from "../../components/CartProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowLeftIcon,
  ReceiptIcon,
  PackageCheckIcon,
} from "@/components/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
type Props = { storeSlug: string; storeName: string };
function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(
    value,
  );
}
export function CheckoutForm({ storeSlug, storeName }: Props) {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {" "}
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
          {" "}
          <EmptyState
            icon={<PackageCheckIcon className="h-12 w-12 text-ink-soft" />}
            title="السلة فارغة"
            description="لم تضيفي أي منتجات للسلة. تصفحي المتجر واختي منتجاتك المفضلة."
          >
            {" "}
            <Link href={`/${storeSlug}`}>
              {" "}
              <Button variant="primary">العودة للمتجر</Button>{" "}
            </Link>{" "}
          </EmptyState>{" "}
        </div>{" "}
      </div>
    );
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("الاسم ورقم الهاتف مطلوبان");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/stores/${storeSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address || null,
          notes: formData.notes || null,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء إنشاء الطلب");
      }
      clearCart();
      router.push(
        `/${storeSlug}/checkout/confirmation?order=${data.data.order.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {" "}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {" "}
        <nav className="mb-6" aria-label="التنقل">
          {" "}
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-brand"
          >
            {" "}
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />{" "}
            <span>العودة للمتجر</span>{" "}
          </Link>{" "}
        </nav>{" "}
        <h1 className="mb-8 font-display text-2xl font-bold text-ink">
          إتمام الطلب
        </h1>{" "}
        {error && (
          <div className="mb-6 rounded-xl border border-danger bg-danger-bg p-4 text-sm text-danger">
            {" "}
            {error}{" "}
          </div>
        )}{" "}
        <div className="grid gap-8 lg:grid-cols-5">
          {" "}
          {/* Order Form */}{" "}
          <div className="lg:col-span-3">
            {" "}
            <form onSubmit={handleSubmit} className="space-y-6">
              {" "}
              <div className="rounded-2xl border border-line bg-surface p-6">
                {" "}
                <h2 className="mb-4 text-lg font-bold text-ink">
                  معلومات التوصيل
                </h2>{" "}
                <div className="space-y-4">
                  {" "}
                  <Input
                    label="الاسم الكامل"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="أدخلي اسمك الكامل"
                    required
                  />{" "}
                  <Input
                    label="رقم الهاتف"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="مثال: 967700000000"
                    required
                  />{" "}
                  <Input
                    label="العنوان"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="المدينة، الحي، الشارع"
                  />{" "}
                  <div>
                    {" "}
                    <label className="mb-1 block text-sm font-medium text-ink">
                      ملاحظات (اختياري)
                    </label>{" "}
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="أي ملاحظات خاصة بالطلب..."
                      rows={3}
                      className="w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/15"
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {" "}
                {isSubmitting ? "جاري إرسال الطلب..." : "تأكيد الطلب"}{" "}
              </Button>{" "}
            </form>{" "}
          </div>{" "}
          {/* Order Summary */}{" "}
          <div className="lg:col-span-2">
            {" "}
            <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6">
              {" "}
              <h2 className="mb-4 text-lg font-bold text-ink">
                ملخص الطلب
              </h2>{" "}
              <ul className="mb-4 space-y-3">
                {" "}
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    className="flex gap-3"
                  >
                    {" "}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eee6d9]">
                      {" "}
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-ink-soft">
                          لا صورة
                        </div>
                      )}{" "}
                    </div>{" "}
                    <div className="flex-1">
                      {" "}
                      <p className="text-sm font-medium text-ink line-clamp-1">
                        {item.name}
                      </p>{" "}
                      {item.variantLabel && (
                        <p className="text-xs text-ink-soft">
                          {item.variantLabel}
                        </p>
                      )}{" "}
                      <p className="text-xs text-ink-soft">
                        {" "}
                        الكمية: {item.quantity}{" "}
                      </p>{" "}
                    </div>{" "}
                    <div className="text-left">
                      {" "}
                      <p className="font-mono text-sm font-medium text-ink">
                        {" "}
                        {formatPrice(item.price * item.quantity)}{" "}
                      </p>{" "}
                    </div>{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
              <div className="border-t border-line pt-4">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span className="text-sm text-ink-soft">المجموع</span>{" "}
                  <span className="font-display text-xl font-bold text-ink">
                    {" "}
                    {formatPrice(total)}{" "}
                    <span className="text-sm font-normal text-ink-soft">
                      ريال يمني
                    </span>{" "}
                  </span>{" "}
                </div>{" "}
                <p className="mt-2 text-xs text-ink-soft/60">
                  {" "}
                  السعر النهائي يُحسب ويُؤكد من قبل المتجر{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
