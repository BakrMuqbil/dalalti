import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StoreIcon } from "@/components/icons";
import type { Store } from "../hooks/useAdminStores";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}
function storeStatus(status: Store["status"]) { return status === "ACTIVE" ? "نشط" : "موقوف"; }
function subscriptionStatus(status: NonNullable<Store["subscription"]>["status"]) {
  if (status === "ACTIVE") return "نشط";
  if (status === "EXPIRED") return "منتهي";
  return "ملغى";
}

type Props = { stores: Store[]; loading: boolean; onDetails: (store: Store) => void };

export function StoresTable({ stores, loading, onDetails }: Props) {
  const headings = ["المتجر", "صاحب المتجر", "الباقة", "الاشتراك", "انتهاء الاشتراك", "الحالة", "الإجراء"];
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_-30px_rgba(43,36,32,0.45)]">
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-gold">STORES</span>
            <h2 className="mt-1 font-semibold text-ink">المتاجر المسجلة</h2>
            <p className="mt-1 text-sm text-ink-soft">البيانات الحالية من قاعدة البيانات</p>
          </div>
          {!loading && <span className="rounded-full bg-background px-3 py-1 font-mono text-xs text-ink-soft">{stores.length} متجر</span>}
        </div>
      </div>
      {loading ? (
        <Spinner label="جاري تحميل المتاجر..." />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon width={28} height={28} className="text-ink-soft" />}
          title="لا توجد متاجر"
          description="لم يتم إنشاء أي متجر حتى الآن."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-right">
            <thead className="bg-background"><tr className="border-b border-line">{headings.map((heading) => <th key={heading} className="px-6 py-4 text-xs font-semibold text-ink-soft">{heading}</th>)}</tr></thead>
            <tbody>{stores.map((store) => <tr key={store.id} className="border-b border-line last:border-b-0 hover:bg-background/70">
              <td className="px-6 py-5"><div className="font-semibold text-ink">{store.name}</div><div className="mt-1 font-mono text-xs text-ink-soft/80">/{store.slug}</div></td>
              <td className="px-6 py-5"><div className="font-medium text-ink">{store.owner.name}</div><div className="mt-1 text-xs text-ink-soft">{store.owner.phone || store.owner.email || "—"}</div></td>
              <td className="px-6 py-5">{store.subscription ? <><div className="font-medium text-ink">{store.subscription.plan.name}</div><div className="mt-1 font-mono text-xs text-ink-soft">{store.subscription.plan.price} ريال</div></> : <span className="text-sm text-ink-soft/80">بدون اشتراك</span>}</td>
              <td className="px-6 py-5">{store.subscription ? <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${store.subscription.status === "ACTIVE" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>{subscriptionStatus(store.subscription.status)}</span> : "—"}</td>
              <td className="px-6 py-5 text-sm text-ink-soft">{store.subscription ? formatDate(store.subscription.endsAt) : "—"}</td>
              <td className="px-6 py-5"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${store.status === "ACTIVE" ? "bg-success-bg text-success" : "bg-surface-alt text-ink-soft"}`}>{storeStatus(store.status)}</span></td>
              <td className="px-6 py-5"><button type="button" onClick={() => onDetails(store)} className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:border-gold hover:text-ink">إدارة الحساب</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
