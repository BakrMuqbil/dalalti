"use client";
import { useState } from "react";
import { useCart } from "../CartProvider";
import { Button } from "@/components/ui/Button";
import { VariantSelector } from "../products/[productId]/components/VariantSelector";
type Variant = {
  id: string;
  color: string | null;
  size: string | null;
  price: number;
  availability: "AVAILABLE" | "UNAVAILABLE";
};
type Props = {
  productId: string;
  name: string;
  price: number;
  availability: "AVAILABLE" | "UNAVAILABLE";
  imageUrl: string | null;
  storeSlug: string;
  variants: Variant[];
};
function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(
    value,
  );
}
export function ProductActions({
  productId,
  name,
  price,
  availability,
  imageUrl,
  storeSlug,
  variants,
}: Props) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const currentPrice = selectedVariant?.price ?? price;
  const isAvailable = selectedVariant
    ? selectedVariant.availability === "AVAILABLE"
    : availability === "AVAILABLE";
  const variantLabel = selectedVariant
    ? [selectedVariant.color, selectedVariant.size]
        .filter(Boolean)
        .join(" / ") || null
    : null;
  const handleAddToCart = () => {
    if (!isAvailable) return;
    addItem({
      productId,
      variantId: selectedVariant?.id ?? null,
      name,
      price: currentPrice,
      imageUrl,
      storeSlug,
      variantLabel,
    });
  };
  const requiresVariant = variants.length > 0;
  const canAdd = isAvailable && (!requiresVariant || selectedVariant !== null);
  return (
    <div className="space-y-6">
      {" "}
      {/* Variants */}{" "}
      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          basePrice={price}
          onVariantChange={setSelectedVariant}
        />
      )}{" "}
      {/* Base Price (no variants) */}{" "}
      {variants.length === 0 && (
        <div className="border-t border-line pt-6">
          {" "}
          <div className="flex items-baseline gap-2">
            {" "}
            <span className="font-display text-3xl font-bold text-ink">
              {" "}
              {formatPrice(price)}{" "}
            </span>{" "}
            <span className="text-sm text-ink-soft">ريال يمني</span>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Availability (no variants) */}{" "}
      {variants.length === 0 && (
        <div className="flex items-center gap-2">
          {" "}
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${availability === "AVAILABLE" ? "bg-success" : "bg-danger"}`}
            aria-hidden
          />{" "}
          <span
            className={`text-sm font-medium ${availability === "AVAILABLE" ? "text-success" : "text-danger"}`}
          >
            {" "}
            {availability === "AVAILABLE" ? "متوفر" : "غير متوفر"}{" "}
          </span>{" "}
        </div>
      )}{" "}
      {/* CTA */}{" "}
      <div className="pt-4">
        {" "}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={!canAdd}
        >
          {" "}
          {requiresVariant && !selectedVariant
            ? "اختيار الخيارات"
            : isAvailable
              ? "أضف إلى السلة"
              : "غير متوفر حالياً"}{" "}
        </Button>{" "}
      </div>{" "}
    </div>
  );
}
