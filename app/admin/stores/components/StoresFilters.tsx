"use client";

import { Pagination } from "../hooks/useAdminStores";
import { Plan } from "../hooks/useAdminStores";

interface StoresFiltersProps {
  search: string;
  statusFilter: string;
  planFilter: string;
  plans: Plan[];
  pagination: Pagination;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPlanChange: (value: string) => void;
}

export function StoresFilters({
  search,
  statusFilter,
  planFilter,
  plans,
  pagination,
  onSearchChange,
  onStatusChange,
  onPlanChange,
}: StoresFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">
          البحث
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="اسم المتجر، الرابط، المالك، الهاتف..."
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gold"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">
          الحالة
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gold sm:w-36"
        >
          <option value="">الكل</option>
          <option value="ACTIVE">نشط</option>
          <option value="SUSPENDED">موقوف</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">
          الباقة
        </label>
        <select
          value={planFilter}
          onChange={(e) => onPlanChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gold sm:w-44"
        >
          <option value="">الكل</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-ink-soft sm:mb-2.5">
        {pagination.total} متجر
      </div>
    </div>
  );
}
