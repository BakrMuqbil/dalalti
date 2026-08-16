"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { EyeIcon, PlusIcon } from "@/components/icons";
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  availability: "AVAILABLE" | "UNAVAILABLE";
  images: { imageUrl: string; isPrimary: boolean }[];
  variants: { id: string }[];
  category: { id: string; name: string } | null;
};
type Props = { product: Product; storeSlug: string };
function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(
    value,
  );
}
export function QuickViewButton({ product, storeSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { addItem } = useCart();
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.imageUrl ?? null;
  const variantCount = product.variants.length;
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.availability !== "AVAILABLE") return;
    if (variantCount > 0) {
      window.location.href = `/${storeSlug}/products/${product.id}`;
      return;
    }
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: product.price,
      imageUrl,
      storeSlug,
      variantLabel: null,
    });
    setIsOpen(false);
  };
  return (
    <>
      {" "}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-brand hover:text-white"
        aria-label="عرض سريع"
      >
        {" "}
        <EyeIcon className="h-4 w-4" />{" "}
      </button>{" "}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={product.name}
        size="lg"
      >
        {" "}
        <div className="grid gap-6 md:grid-cols-2">
          {" "}
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#eee6d9]">
            {" "}
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-soft">
                {" "}
                لا توجد صورة{" "}
              </div>
            )}{" "}
          </div>{" "}
          <div className="flex flex-col">
            {" "}
            {product.category && (
              <p className="mb-1 text-sm font-medium text-gold">
                {product.category.name}
              </p>
            )}{" "}
            <h2 className="font-display text-xl font-bold text-ink">
              {product.name}
            </h2>{" "}
            {product.description && (
              <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-4">
                {product.description}
              </p>
            )}{" "}
            <div className="mt-4 flex items-baseline gap-2">
              {" "}
              <span className="font-display text-2xl font-bold text-ink">
                {" "}
                {formatPrice(product.price)}{" "}
              </span>{" "}
              <span className="text-sm text-ink-soft">ريال يمني</span>{" "}
            </div>{" "}
            <span
              className={`mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ${product.availability === "AVAILABLE" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}
            >
              {" "}
              {product.availability === "AVAILABLE"
                ? "متوفر"
                : "غير متوفر"}{" "}
            </span>{" "}
            <div className="mt-auto flex gap-3 pt-6">
              {" "}
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleQuickAdd}
                disabled={product.availability !== "AVAILABLE"}
              >
                {" "}
                <PlusIcon className="me-2 h-4 w-4" />{" "}
                {variantCount > 0 ? "اختيار الخيارات" : "إضافة للسلة"}{" "}
              </Button>{" "}
              <Link
                href={`/${storeSlug}/products/${product.id}`}
                onClick={() => setIsOpen(false)}
              >
                {" "}
                <Button variant="secondary"> التفاصيل </Button>{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </Modal>{" "}
    </>
  );
}
