"use client";

import { FormEvent, useEffect, useState } from "react";

export type Category = {
  id: string;
  storeId: string;
  parentId: string | null;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;

  children?: Category[];

  _count?: {
    products: number;
    children: number;
  };
};

type CategoryResponse = {
  success: boolean;
  message?: string;
  categories?: Category[];
  category?: Category;
};

async function readJson(response: Response): Promise<CategoryResponse> {
  const data = (await response.json()) as CategoryResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "حدث خطأ في الطلب");
  }

  return data;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");

  const [parentId, setParentId] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  const [imageFile, setImageFile] = useState<File | undefined>();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>();

  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/store/categories", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await readJson(response);

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Load categories failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل التصنيفات",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setName("");
    setParentId("");
    setImageUrl("");
    setImageFile(undefined);
    setImagePreviewUrl(undefined);
    setEditingId(null);
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("الملف المحدد ليس صورة");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 10MB");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setError("");
    setImageFile(file);

    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(undefined);
    setImagePreviewUrl(undefined);
    setImageUrl("");
  }

  async function uploadCategoryImage(categoryId: string, file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      `/api/store/categories/${categoryId}/images/upload`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "فشل رفع صورة الفئة");
    }

    return data.imageUrl as string;
  }

  async function createCategory(trimmedName: string) {
    const response = await fetch("/api/store/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: trimmedName,
        parentId: parentId || null,
        imageUrl: null,
      }),
    });

    return readJson(response);
  }

  async function updateCategory(
    categoryId: string,
    trimmedName: string,
    finalImageUrl: string | null,
  ) {
    const response = await fetch(`/api/store/categories/${categoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: trimmedName,
        imageUrl: finalImageUrl,
      }),
    });

    return readJson(response);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("اسم التصنيف مطلوب");
      return;
    }

    if (!editingId && !imageFile) {
      setError("صورة الفئة مطلوبة");
      return;
    }

    if (editingId && !imageUrl && !imageFile) {
      setError("صورة الفئة مطلوبة");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      /*
       * إنشاء فئة جديدة:
       *
       * 1. ننشئ الفئة أولًا.
       * 2. نحصل على category.id.
       * 3. نرفع الصورة باستخدام نفس نمط صور المنتجات.
       * 4. نحدث imageUrl.
       */
      if (!editingId) {
        if (!imageFile) {
          throw new Error("صورة الفئة مطلوبة");
        }

        const created = await createCategory(trimmedName);

        if (!created.category) {
          throw new Error("تم إنشاء الفئة ولكن لم يتم إرجاع بياناتها");
        }

        const categoryId = created.category.id;

        try {
          const uploadedImageUrl = await uploadCategoryImage(
            categoryId,
            imageFile,
          );

          await updateCategory(categoryId, trimmedName, uploadedImageUrl);
        } catch (uploadError) {
          /*
           * إذا فشل رفع الصورة بعد إنشاء الفئة،
           * نحاول حذف الفئة حتى لا تبقى فئة
           * بدون صورة.
           */
          try {
            await fetch(`/api/store/categories/${categoryId}`, {
              method: "DELETE",
              credentials: "include",
            });
          } catch (cleanupError) {
            console.error("Category cleanup failed:", cleanupError);
          }

          throw uploadError;
        }

        setMessage("تم إنشاء التصنيف والصورة بنجاح");
      } else {
        /*
         * تعديل فئة موجودة.
         *
         * إذا لم يختَر المستخدم صورة جديدة،
         * نحافظ على الصورة الحالية.
         */
        let finalImageUrl = imageUrl || null;

        if (imageFile) {
          finalImageUrl = await uploadCategoryImage(editingId, imageFile);
        }

        await updateCategory(editingId, trimmedName, finalImageUrl);

        setMessage("تم تحديث التصنيف والصورة بنجاح");
      }

      resetForm();

      await loadCategories();
    } catch (error) {
      console.error("Save category failed:", error);

      setError(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ التصنيف",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(category: Category) {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setEditingId(category.id);
    setName(category.name);
    setParentId(category.parentId ?? "");
    setImageUrl(category.imageUrl ?? "");
    setImageFile(undefined);
    setImagePreviewUrl(undefined);

    setError("");
    setMessage("");
  }

  async function handleDelete(category: Category) {
    if (saving) {
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف التصنيف "${category.name}"؟`)) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/store/categories/${category.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await readJson(response);

      if (editingId === category.id) {
        resetForm();
      }

      setMessage("تم حذف التصنيف بنجاح");

      await loadCategories();
    } catch (error) {
      console.error("Delete category failed:", error);

      setError(
        error instanceof Error ? error.message : "حدث خطأ أثناء حذف التصنيف",
      );
    } finally {
      setSaving(false);
    }
  }

  const rootCategories = categories.filter((category) => !category.parentId);

  const childCategories = categories.filter((category) =>
    Boolean(category.parentId),
  );

  function getChildren(parentCategoryId: string) {
    return childCategories.filter(
      (category) => category.parentId === parentCategoryId,
    );
  }

  return {
    // state
    categories,
    loading,
    saving,
    name,
    parentId,
    imageUrl,
    imageFile,
    imagePreviewUrl,
    editingId,
    error,
    message,

    // setters
    setName,
    setParentId,

    // derived
    rootCategories,
    childCategories,
    getChildren,

    // actions
    loadCategories,
    resetForm,
    handleImageFile,
    removeImage,
    handleSubmit,
    startEditing,
    handleDelete,
  };
}
