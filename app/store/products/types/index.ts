export type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  price: string | null;
  availability: "AVAILABLE" | "UNAVAILABLE";
};

export type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  status: "ACTIVE" | "INACTIVE";
};

export type ImageDraft = {
  id?: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  file?: File;
  previewUrl?: string;
  uploading?: boolean;
};

export type VariantDraft = {
  id?: string;
  color: string;
  size: string;
  price: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  availability: "AVAILABLE",
  status: "ACTIVE",
};

export function emptyImageDraft(): ImageDraft {
  return { imageUrl: "", sortOrder: 0, isPrimary: true };
}

export function emptyVariantDraft(): VariantDraft {
  return { color: "", size: "", price: "", availability: "AVAILABLE" };
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
