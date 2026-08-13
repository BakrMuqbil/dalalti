"use client";

import { useState } from "react";
import {
  ReceiptIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOrders, type OrderStatus } from "./hooks/useOrders";

const statusLabels: Record<OrderStatus, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التنفيذ",
  READY: "جاهز",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغى",
};

const statusClasses: Record<OrderStatus, string> = {
  NEW: "bg-gold-soft/40 text-brand-deep",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-warning/15 text-warning",
  READY: "bg-brand/10 text-brand",
  DELIVERED: "bg-success-bg text-success",
  CANCELLED: "bg-danger-bg text-danger",
};

const statusOptions: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "الكل" },
  { value: "NEW", label: "جديد" },
  { value: "CONFIRMED", label: "مؤكد" },
  { value: "PROCESSING", label: "قيد التنفيذ" },
  { value: "READY", label: "جاهز" },
  { value: "DELIVERED", label: "مكتمل" },
  { value: "CANCELLED", label: "ملغى" },
];

function money(value: string | number) {
  return `${Number(value).toLocaleString("ar-SA")} ريال`;
}

function date(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function OrdersPage() {
  const { orders, loading, saving, statusFilter, setStatusFilter, updateStatus } =
    useOrders();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  function toggleExpand(orderId: string) {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            إدارة الطلبات
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            متابعة وإدارة طلبات المتجر وتحديث حالتها.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <FilterIcon width={16} height={16} className="text-ink-soft" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
            className="bg-transparent text-sm outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-ink-soft">{orders.length} طلب</span>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-line bg-surface">
          <Spinner label="جاري تحميل الطلبات..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface">
          <EmptyState
            icon={<span className="text-4xl">📋</span>}
            title="لا توجد طلبات"
            description={
              statusFilter
                ? "لا توجد طلبات تطابق الفلتر المحدد."
                : "لم يتم استلام أي طلبات حتى الآن."
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-line bg-surface shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleExpand(order.id)}
                className="flex w-full flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-right">
                  <p className="truncate font-semibold text-ink">
                    {order.customer?.name ?? "عميل"}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {order.items?.length ?? 0} عنصر · {date(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <span className="font-bold text-ink">
                    {money(order.totalAmount)}
                  </span>
                  <ChevronDownIcon
                    width={16}
                    height={16}
                    className={`shrink-0 text-ink-soft transition ${expandedOrderId === order.id ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {expandedOrderId === order.id && (
                <div className="border-t border-line px-5 py-4 sm:px-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-ink-soft">
                        تفاصيل الطلب
                      </p>
                      <div className="mt-2 space-y-2">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-ink">
                              {item.product.name}{" "}
                              {item.variant
                                ? `(${item.variant.color ?? ""} ${item.variant.size ?? ""})`
                                : ""}{" "}
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-soft">
                        تحديث الحالة
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(
                          [
                            "NEW",
                            "CONFIRMED",
                            "PROCESSING",
                            "READY",
                            "DELIVERED",
                            "CANCELLED",
                          ] as OrderStatus[]
                        ).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={saving || order.status === status}
                            onClick={() => updateStatus(order.id, status)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${order.status === status ? "bg-brand text-white" : "border border-line bg-background hover:border-gold"} disabled:opacity-50`}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
