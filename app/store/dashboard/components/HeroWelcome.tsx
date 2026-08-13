import { ReceiptIcon, BoxIcon } from "@/components/icons";

type HeroWelcomeProps = {
  userName: string;
  storeName: string;
  newOrders: number;
  processingOrders: number;
  unavailableProducts: number;
  deliveredRevenue: number;
};

export function HeroWelcome({
  userName,
  storeName,
  newOrders,
  processingOrders,
  unavailableProducts,
  deliveredRevenue,
}: HeroWelcomeProps) {
  const revenue = deliveredRevenue.toLocaleString("ar-SA");

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-l from-surface via-surface to-[#f3ede2] p-6 shadow-sm sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #B8862E 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-gold-soft/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-sm font-semibold text-brand shadow-sm ring-1 ring-line">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          مركز التحكم
        </div>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              أهلًا {userName}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              هذه نظرة سريعة على نشاط <span className="font-bold text-ink">{storeName}</span> اليوم.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface/85 px-3 py-3">
              <div className="flex items-center gap-1.5 text-gold">
                <ReceiptIcon width={14} height={14} />
                <span className="text-[10px] font-bold">جديد</span>
              </div>
              <p className="mt-1 text-xl font-bold text-ink">{newOrders}</p>
            </div>

            <div className="rounded-2xl border border-line bg-surface/85 px-3 py-3">
              <div className="flex items-center gap-1.5 text-brand">
                <ReceiptIcon width={14} height={14} />
                <span className="text-[10px] font-bold">تنفيذ</span>
              </div>
              <p className="mt-1 text-xl font-bold text-ink">{processingOrders}</p>
            </div>

            <div className="rounded-2xl border border-line bg-surface/85 px-3 py-3">
              <div className="flex items-center gap-1.5 text-danger">
                <BoxIcon width={14} height={14} />
                <span className="text-[10px] font-bold">غير متاح</span>
              </div>
              <p className="mt-1 text-xl font-bold text-ink">{unavailableProducts}</p>
            </div>

            <div className="rounded-2xl border border-line bg-surface/85 px-3 py-3">
              <span className="text-[10px] font-bold text-success">مبيعات مكتملة</span>
              <p className="mt-1 whitespace-nowrap text-sm font-bold text-ink">
                {revenue} ريال
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
