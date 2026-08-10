import type { Store } from "../hooks/useAdminStores";

type Props = { stores: Store[]; loading: boolean };

export function StoresStats({ stores, loading }: Props) {
  const activeStores = stores.filter((store) => store.status === "ACTIVE").length;
  const activeSubscriptions = stores.filter((store) => store.subscription?.status === "ACTIVE").length;
  const cards = [
    { label: "إجمالي المتاجر", value: stores.length, tone: "text-ink" },
    { label: "المتاجر النشطة", value: activeStores, tone: "text-success" },
    { label: "الاشتراكات النشطة", value: activeSubscriptions, tone: "text-brand" },
  ];
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_-24px_rgba(43,36,32,0.35)]">
          <p className="text-sm text-ink-soft">{card.label}</p>
          <p className={`mt-2 font-mono text-3xl font-medium ${card.tone}`}>{loading ? "..." : card.value}</p>
        </div>
      ))}
    </div>
  );
}
