import { ArrowLeftIcon, UsersIcon } from "@/components/icons";
import Link from "next/link";
import type { DashboardCustomer } from "../hooks/useDashboardData";

function date(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function RecentCustomersList({
  customers,
  loading,
}: {
  customers: DashboardCustomer[];
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-5 py-5 sm:px-6">
        <UsersIcon width={18} height={18} className="text-success" />
        <div>
          <h2 className="font-display font-bold text-ink">آخر العملاء</h2>
          <p className="mt-1 text-xs text-ink-soft">
            العملاء الذين تمت إضافتهم مؤخرًا.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-soft">جاري تحميل العملاء...</div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink-soft">لا يوجد عملاء حتى الآن.</div>
      ) : (
        <div className="divide-y divide-line">
          {customers.map((customer) => (
            <div key={customer.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-bg font-bold text-success">
                  {customer.name.trim().charAt(0) || "ع"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{customer.name}</p>
                  <p className="mt-1 text-xs text-ink-soft" dir="ltr">
                    {customer.phone}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-left">
                <p className="font-bold text-ink">{customer._count?.orders ?? 0}</p>
                <p className="mt-1 text-[11px] text-ink-soft">طلب</p>
                <p className="mt-1 text-[10px] text-ink-soft/70">{date(customer.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {customers.length > 0 && (
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <Link
            href="/store/customers"
            className="flex items-center gap-1.5 text-sm font-bold text-success transition hover:gap-2.5"
          >
            عرض كل العملاء
            <ArrowLeftIcon width={15} height={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
