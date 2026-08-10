"use client";

import { FormEvent, useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: string;
  billingPeriod: "MONTHLY" | "YEARLY";
};

type Props = {
  plans: Plan[];
  onCreated: () => void;
};

export default function CreateStoreForm({
  plans,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    storeName: "",
    slug: "",
    planId: plans[0]?.id ?? "",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function generateSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06ff-]/g, "")
      .replace(/-+/g, "-");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "فشل إنشاء المتجر"
        );
      }

      setMessage("تم إنشاء المتجر والاشتراك بنجاح");

      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        storeName: "",
        slug: "",
        planId: plans[0]?.id ?? "",
      });

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            اسم المالك
          </label>

          <input
            required
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            placeholder="مثال: أحمد محمد"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            رقم الهاتف
          </label>

          <input
            required
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            placeholder="77xxxxxxx"
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            البريد الإلكتروني
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              updateField("email", e.target.value)
            }
            placeholder="example@email.com"
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            كلمة مرور المالك
          </label>

          <input
            required
            minLength={8}
            type="password"
            value={form.password}
            onChange={(e) =>
              updateField("password", e.target.value)
            }
            placeholder="8 أحرف على الأقل"
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            اسم المتجر
          </label>

          <input
            required
            value={form.storeName}
            onChange={(e) => {
              const value = e.target.value;

              setForm((current) => ({
                ...current,
                storeName: value,
                slug:
                  current.slug ===
                  generateSlug(current.storeName)
                    ? generateSlug(value)
                    : current.slug,
              }));
            }}
            placeholder="مثال: متجر دلالتي"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            رابط المتجر
          </label>

          <input
            required
            value={form.slug}
            onChange={(e) =>
              updateField(
                "slug",
                generateSlug(e.target.value)
              )
            }
            placeholder="my-store"
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            الباقة
          </label>

          <select
            required
            value={form.planId}
            onChange={(e) =>
              updateField("planId", e.target.value)
            }
            className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            {plans.map((plan) => (
              <option
                key={plan.id}
                value={plan.id}
              >
                {plan.name} — {plan.price} ريال
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "جاري إنشاء المتجر..." : "إنشاء المتجر"}
        </button>
      </div>
    </form>
  );
}
