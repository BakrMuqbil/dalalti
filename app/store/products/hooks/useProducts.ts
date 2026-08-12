"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useToast } from '@/app/store/components/ToastProvider';
import {
  Category,
  ImageDraft,
  Product,
  ProductFormValues,
  VariantDraft,
  emptyImageDraft,
  emptyProductForm,
  emptyVariantDraft,
} from '../types';

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'حدث خطأ في الطلب');
  }
  return data;
}

export interface ProductFilters {
  categoryId: string;
  availability: '' | 'AVAILABLE' | 'UNAVAILABLE';
  status: '' | 'ACTIVE' | 'INACTIVE';
}

export interface ProductPagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export function useProducts() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    categoryId: '',
    availability: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProductPagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === 'ACTIVE').length,
    [products],
  );

  const availableProducts = useMemo(
    () => products.filter((product) => product.availability === 'AVAILABLE').length,
    [products],
  );

  const buildQueryString = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.availability) params.set('availability', filters.availability);
      if (filters.status) params.set('status', filters.status);
      params.set('page', String(targetPage));
      params.set('limit', String(pagination.limit));
      return params.toString();
    },
    [searchQuery, filters, pagination.limit],
  );

  async function loadProducts(targetPage = page) {
    try {
      setLoading(true);
      setError('');
      const qs = buildQueryString(targetPage);
      const response = await fetch(`/api/store/products?${qs}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await readJson(response);
      setProducts(data.products);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Load products failed:', err);
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل المنتجات';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch('/api/store/categories', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await readJson(response);
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error('Load categories failed:', err);
      setCategories([]);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadProducts(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, filters.categoryId, filters.availability, filters.status]);

  useEffect(() => {
    void Promise.all([loadProducts(), loadCategories()]);
  }, []);

  function goToPage(newPage: number) {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPage(newPage);
    void loadProducts(newPage);
  }

  function setFilter(key: keyof ProductFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setSearchQuery('');
    setFilters({ categoryId: '', availability: '', status: '' });
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setImages([]);
    setVariants([]);
    setError('');
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      categoryId: product.categoryId ?? '',
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
        color: variant.color ?? '',
        size: variant.size ?? '',
        price: variant.price ?? '',
        availability: variant.availability,
      })),
    );
    setError('');
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
    if (!file.type.startsWith('image/')) {
      setError('الملف المحدد ليس صورة');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة يجب ألا يتجاوز 10MB');
      return;
    }
    setError('');
    const previewUrl = URL.createObjectURL(file);
    updateImage(index, { file, previewUrl, imageUrl: '' });
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
    formData.append('file', file);
    const response = await fetch(
      `/api/store/products/${productId}/images/upload`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      },
    );
    return readJson(response);
  }

  async function saveImages(productId: string) {
    const originalImages = editingProduct?.images ?? [];
    const currentExistingIds = new Set(
      images.map((image) => image.id).filter((id): id is string => Boolean(id)),
    );

    for (const original of originalImages) {
      if (!currentExistingIds.has(original.id)) {
        await readJson(
          await fetch(`/api/store/products/${productId}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageId: original.id }),
          }),
        );
      }
    }

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

    for (let index = 0; index < preparedImages.length; index += 1) {
      const image = preparedImages[index];
      if (!image.id) {
        const response = await fetch(
          `/api/store/products/${productId}/images`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
            {
              method: 'DELETE',
              credentials: 'include',
            },
          ),
        );
      }
    }

    for (const variant of variants) {
      const color = variant.color.trim() || null;
      const size = variant.size.trim() || null;
      const price =
        variant.price.trim() === '' ? null : Number(variant.price);

      if (!color && !size) {
        throw new Error('يجب تحديد لون أو مقاس للمتغير');
      }
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error('سعر المتغير غير صالح');
      }

      const payload = { color, size, price, availability: variant.availability };

      if (variant.id) {
        await readJson(
          await fetch(
            `/api/store/products/${productId}/variants/${variant.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload),
            },
          ),
        );
      } else {
        await readJson(
          await fetch(`/api/store/products/${productId}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          }),
        );
      }
    }
  }

  async function submitProduct() {
    if (saving) return;
    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError('اسم المنتج مطلوب');
      return;
    }
    if (!form.price || !Number.isFinite(price) || price < 0) {
      setError('السعر غير صالح');
      return;
    }

    for (const variant of variants) {
      if (!variant.color.trim() && !variant.size.trim()) {
        setError('يجب تحديد لون أو مقاس لكل متغير');
        return;
      }
      if (
        variant.price.trim() &&
        (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0)
      ) {
        setError('سعر أحد المتغيرات غير صالح');
        return;
      }
    }

    setSaving(true);
    try {
      const isEditing = Boolean(editingProduct);
      const response = await fetch(
        isEditing
          ? `/api/store/products/${editingProduct!.id}`
          : '/api/store/products',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
      const productId = data.product.id as string;

      await saveImages(productId);
      await saveVariants(productId);

      showToast(
        isEditing ? 'تم تحديث المنتج بنجاح' : 'تم إنشاء المنتج بنجاح',
        'success',
      );
      setShowForm(false);
      setEditingProduct(null);
      setForm(emptyProductForm);
      setImages([]);
      setVariants([]);
      void loadProducts(page);
    } catch (err) {
      console.error('Submit product failed:', err);
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (deletingId) return;
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المنتج '${product.name}'؟`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      const response = await fetch(`/api/store/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await readJson(response);
      showToast('تم حذف المنتج بنجاح', 'success');
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
    } catch (err) {
      console.error('Delete product failed:', err);
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ أثناء حذف المنتج';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return {
    products,
    categories,
    loading,
    saving,
    deletingId,
    error,
    activeProducts,
    availableProducts,
    showForm,
    editingProduct,
    form,
    images,
    variants,
    setForm,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilters,
    page,
    pagination,
    goToPage,
    hasActiveFilters: Boolean(
      searchQuery || filters.categoryId || filters.availability || filters.status,
    ),
    loadProducts,
    openCreateForm,
    openEditForm,
    closeForm,
    submitProduct,
    deleteProduct,
    addImage,
    updateImage,
    removeImage,
    setPrimaryImage,
    handleImageFile,
    addVariant,
    updateVariant,
    removeVariant,
  };
}
