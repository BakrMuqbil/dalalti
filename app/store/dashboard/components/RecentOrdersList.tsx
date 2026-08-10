import { ArrowLeftIcon, ReceiptIcon } from "@/components/icons";
import Link from "next/link";
import type { DashboardOrder, DashboardOrderStatus } from "../hooks/useDashboardData";

const statusLabels: Record<DashboardOrderStatus, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التنفيذ",
  READY: "جاهز",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغى",
};

const statusClasses: Record<DashboardOrderStatus, string> = {
  NEW: "bg-gold-soft/40 text-brand-deep",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-warning/15 text-warning",
  READY: "bg-brand/10 text-brand",
  DELIVERED: "bg-success-bg text-success",
  CANCELLED: "bg-danger-bg text-danger",
};

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

export function RecentOrdersList({
  orders,
  loading,
}: {
  orders: DashboardOrder[];
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptIcon width={18} height={18} className="text-brand" />
            <h2 className="font-display font-bold text-ink">آخر الطلبات</h2>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            أحدث العمليات المسجلة في متجرك.
          </p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-ink-soft">
          {orders.length}
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-soft">جاري تحميل الطلبات...</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink-soft">لا توجد طلبات حتى الآن.</div>
      ) : (
        <div className="divide-y divide-line">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{order.customer?.name ?? "عميل"}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {order.items?.length ?? 0} عنصر · {date(order.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
                <span className="font-bold text-ink">{money(order.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-line px-5 py-4 sm:px-6">
        <Link
          href="/store/orders"
          className="flex items-center gap-1.5 text-sm font-bold text-brand transition hover:gap-2.5"
        >
          عرض كل الطلبات
          <ArrowLeftIcon width={15} height={15} />
        </Link>
      </div>
    </section>
  );
}
