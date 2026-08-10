import Link from "next/link";
import { CalendarIcon, CrownIcon } from "@/components/icons";

type SubscriptionCardProps = {
  subscription: {
    status: string;
    endsAt: string;
    plan: {
      name: string;
      price: string | number;
    };
  } | null;
};

function getDaysLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const active = subscription?.status === "ACTIVE";
  const daysLeft = subscription ? getDaysLeft(subscription.endsAt) : 0;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-ink to-[#463c33] p-6 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold">
            <CrownIcon width={17} height={17} />
          </div>
          <p className="text-xs text-background/60">الاشتراك الحالي</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            active
              ? "bg-success/20 text-[#9fd39f]"
              : "bg-warning/20 text-[#e8c477]"
          }`}
        >
          {active ? "نشط" : subscription?.status === "EXPIRED" ? "منتهٍ" : "غير نشط"}
        </span>
      </div>

      <p className="relative mt-3 font-display text-2xl font-bold text-background">
        {subscription?.plan.name ?? "بدون باقة"}
      </p>

      {subscription ? (
        <>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-background/50">المتبقي</p>
              <p className="mt-1 text-2xl font-bold text-background">
                {daysLeft}
                <span className="mr-1 text-xs font-medium text-background/50">
                  يوم
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-background/50">القيمة</p>
              <p className="mt-1 font-bold text-background">
                {subscription.plan.price} ريال
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2.5 border-t border-white/10 pt-4">
            <CalendarIcon width={15} height={15} className="text-background/50" />
            <div>
              <p className="text-xs text-background/50">تاريخ الانتهاء</p>
              <p className="mt-0.5 text-sm font-semibold text-background">
                {formatDate(subscription.endsAt)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="relative mt-4 text-sm leading-6 text-background/60">
          لا يوجد اشتراك مرتبط بهذا المتجر حاليًا.
        </p>
      )}

      <Link
        href="/store/dashboard"
        className="relative mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white transition hover:bg-[#96691f]"
      >
        {active ? "مراجعة الاشتراك" : "مراجعة الباقة"}
      </Link>
    </article>
  );
}
