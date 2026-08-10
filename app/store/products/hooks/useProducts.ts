"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Category,
  ImageDraft,
  Product,
  ProductFormValues,
  VariantDraft,
  emptyImageDraft,
  emptyProductForm,
  emptyVariantDraft,
} from "../types";

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "حدث خطأ في الطلب");
  }
  return data;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE").length,
    [products],
  );

  const availableProducts = useMemo(
    () =>
      products.filter((product) => product.availability === "AVAILABLE")
        .length,
    [products],
  );

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/store/products", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await readJson(response);
      setProducts(data.products);
    } catch (err) {
      console.error("Load products failed:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المنتجات",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch("/api/store/categories", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await readJson(response);
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Load categories failed:", err);
      setCategories([]);
    }
  }

  useEffect(() => {
    void Promise.all([loadProducts(), loadCategories()]);
  }, []);

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setImages([]);
    setVariants([]);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      categoryId: product.categoryId ?? "",
      availability: product.availability,
      status: product.status,
    });

    setImages(
      [...(product.images ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        })),
    );

    setVariants(
      (product.variants ?? []).map((variant) => ({
        id: variant.id,
        color: variant.color ?? "",
        size: variant.size ?? "",
        price: variant.price ?? "",
        availability: variant.availability,
      })),
    );

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyProductForm);
    setImages([]);
    setVariants([]);
  }

  function updateImage(index: number, patch: Partial<ImageDraft>) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image,
      ),
    );
  }

  function addImage() {
    setImages((current) => [
      ...current,
      {
        ...emptyImageDraft(),
        isPrimary: current.length === 0,
        sortOrder: current.length,
      },
    ]);
  }

  function handleImageFile(index: number, file: File) {
    if (!file.type.startsWith("image/")) {
      setError("الملف المحدد ليس صورة");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 10MB");
      return;
    }

    setError("");
    const previewUrl = URL.createObjectURL(file);

    updateImage(index, { file, previewUrl, imageUrl: "" });
  }

  function removeImage(index: number) {
    setImages((current) => {
      const removed = current[index];
      const next = current.filter((_, imageIndex) => imageIndex !== index);

      if (removed?.isPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }

      return next.map((image, imageIndex) => ({
        ...image,
        sortOrder: imageIndex,
      }));
    });
  }

  function setPrimaryImage(index: number) {
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      })),
    );
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((current) => [...current, emptyVariantDraft()]);
  }

  function removeVariant(index: number) {
    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  async function uploadProductImage(file: File, productId: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/store/products/${productId}/images/upload`,
      { method: "POST", credentials: "include", body: formData },
    );

    return readJson(response);
  }

  async function saveImages(productId: string) {
    const originalImages = editingProduct?.images ?? [];

    const currentExistingIds = new Set(
      images.map((image) => image.id).filter((id): id is string => Boolean(id)),
    );

    // حذف الصور التي حذفها المستخدم من الواجهة
    for (const original of originalImages) {
      if (!currentExistingIds.has(original.id)) {
        await readJson(
          await fetch(`/api/store/products/${productId}/images`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ imageId: original.id }),
          }),
        );
      }
    }

    // رفع الصور الجديدة أولاً
    const preparedImages: ImageDraft[] = [];

    for (const image of images) {
      let imageUrl = image.imageUrl.trim();

      if (image.file) {
        const data = await uploadProductImage(image.file, productId);
        imageUrl = data.imageUrl;
      }

      if (!imageUrl) continue;

      preparedImages.push({ ...image, imageUrl });
    }

    // ضمان وجود صورة رئيسية واحدة فقط
    if (preparedImages.length > 0) {
      const primaryIndex = preparedImages.findIndex((image) => image.isPrimary);
      const finalPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

      for (let index = 0; index < preparedImages.length; index += 1) {
        preparedImages[index] = {
          ...preparedImages[index],
          sortOrder: index,
          isPrimary: index === finalPrimaryIndex,
        };
      }
    }

    // إضافة / تحديث الصور
    for (let index = 0; index < preparedImages.length; index += 1) {
      const image = preparedImages[index];

      if (!image.id) {
        const response = await fetch(
          `/api/store/products/${productId}/images`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              imageUrl: image.imageUrl,
              sortOrder: index,
              isPrimary: image.isPrimary,
            }),
          },
        );

        await readJson(response);
        continue;
      }

      const original = originalImages.find((item) => item.id === image.id);

      if (
        original &&
        (original.isPrimary !== image.isPrimary || original.sortOrder !== index)
      ) {
        await readJson(
          await fetch(`/api/store/products/${productId}/images`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              imageId: image.id,
              isPrimary: image.isPrimary,
              sortOrder: index,
            }),
          }),
        );
      }
    }
  }

  async function saveVariants(productId: string) {
    const originalVariants = editingProduct?.variants ?? [];
    const currentExistingIds = new Set(
      variants
        .map((variant) => variant.id)
        .filter((id): id is string => Boolean(id)),
    );

    for (const original of originalVariants) {
      if (!currentExistingIds.has(original.id)) {
        await readJson(
          await fetch(
            `/api/store/products/${productId}/variants/${original.id}`,
            { method: "DELETE", credentials: "include" },
          ),
        );
      }
    }

    for (const variant of variants) {
      const color = variant.color.trim() || null;
      const size = variant.size.trim() || null;
      const price = variant.price.trim() === "" ? null : Number(variant.price);

      if (!color && !size) {
        throw new Error("كل متغير يجب أن يحتوي على لون أو مقاس على الأقل");
      }

      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error("يوجد سعر متغير غير صالح");
      }

      const payload = { color, size, price, availability: variant.availability };

      if (variant.id) {
        await readJson(
          await fetch(
            `/api/store/products/${productId}/variants/${variant.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            },
          ),
        );
      } else {
        await readJson(
          await fetch(`/api/store/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }),
        );
      }
    }
  }

  async function submitProduct() {
    if (saving) return;

    setError("");
    setMessage("");

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError("اسم المنتج مطلوب");
      return;
    }

    if (!form.price || !Number.isFinite(price) || price < 0) {
      setError("يرجى إدخال سعر صحيح");
      return;
    }

    for (const variant of variants) {
      if (!variant.color.trim() && !variant.size.trim()) {
        setError("كل متغير يجب أن يحتوي على لون أو مقاس على الأقل");
        return;
      }

      if (
        variant.price.trim() &&
        (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0)
      ) {
        setError("يوجد سعر متغير غير صالح");
        return;
      }
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingProduct);

      const response = await fetch(
        isEditing
          ? `/api/store/products/${editingProduct!.id}`
          : "/api/store/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            description: form.description.trim() || null,
            price,
            categoryId: form.categoryId || null,
            availability: form.availability,
            status: form.status,
          }),
        },
      );

      const data = await readJson(response);
      const productId = data.product.id;

      await saveImages(productId);
      await saveVariants(productId);

      setMessage(
        isEditing
          ? "تم تحديث المنتج وخصائصه بنجاح"
          : "تم إنشاء المنتج وخصائصه بنجاح",
      );

      setShowForm(false);
      setEditingProduct(null);
      setForm(emptyProductForm);
      setImages([]);
      setVariants([]);

      await loadProducts();
    } catch (err) {
      console.error("Save product failed:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المنتج");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المنتج "${product.name}"؟`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(product.id);

    try {
      const response = await fetch(`/api/store/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await readJson(response);

      setMessage("تم حذف المنتج بنجاح");
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      console.error("Delete product failed:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حذف المنتج");
    } finally {
      setDeletingId(null);
    }
  }

  return {
    // بيانات
    products,
    categories,
    loading,
    saving,
    deletingId,
    error,
    message,
    activeProducts,
    availableProducts,

    // فورم
    showForm,
    editingProduct,
    form,
    images,
    variants,
    setForm,

    // إجراءات
    loadProducts,
    openCreateForm,
    openEditForm,
    closeForm,
    submitProduct,
    deleteProduct,

    // إجراءات الصور
    addImage,
    updateImage,
    removeImage,
    setPrimaryImage,
    handleImageFile,

    // إجراءات المتغيرات
    addVariant,
    updateVariant,
    removeVariant,
  };
}
