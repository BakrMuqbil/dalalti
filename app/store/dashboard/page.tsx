"use client";
import StoreShareCard from "./components/StoreShareCard";
import Link from "next/link";
import {
  BoxIcon,
  CalendarIcon,
  CrownIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  ReceiptIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";
import { useStoreIdentity } from "../components/StoreIdentityContext";
import { DashboardStat } from "./components/DashboardStat";
import { HeroWelcome } from "./components/HeroWelcome";
import { ManagementCard } from "./components/ManagementCard";
import { RecentCustomersList } from "./components/RecentCustomersList";
import { RecentOrdersList } from "./components/RecentOrdersList";
import { SubscriptionCard } from "./components/SubscriptionCard";
import { useDashboardData } from "./hooks/useDashboardData";

export default function StoreDashboardPage() {
  const { userName, phone, email, store, subscription } = useStoreIdentity();

  const {
    products,
    categories,
    customers,
    orders,
    newOrders,
    processingOrders,
    deliveredRevenue,
    unavailableProducts,
    recentOrders,
    recentCustomers,
    loading,
    refreshing,
    error,
    refresh,
  } = useDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <HeroWelcome
        userName={userName}
        storeName={store.name}
        newOrders={newOrders}
        processingOrders={processingOrders}
        unavailableProducts={unavailableProducts}
        deliveredRevenue={deliveredRevenue}
      />
      <StoreShareCard storeSlug={store.slug} storeName={store.name} />

      {error && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs font-bold hover:bg-background disabled:opacity-50"
          >
            {refreshing ? "جاري التحديث..." : "إعادة المحاولة"}
          </button>
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStat
          label="المنتجات"
          value={products}
          hint={
            unavailableProducts
              ? `${unavailableProducts} غير متوفر`
              : "كل المنتجات متاحة"
          }
          tone="brand"
          icon={<BoxIcon width={20} height={20} />}
          href="/store/products"
          loading={loading}
        />
        <DashboardStat
          label="التصنيفات"
          value={categories}
          hint="الرئيسية والفرعية"
          tone="gold"
          icon={<TagIcon width={20} height={20} />}
          href="/store/categories"
          loading={loading}
        />
        <DashboardStat
          label="العملاء"
          value={customers}
          hint="العملاء المسجلون"
          tone="success"
          icon={<UsersIcon width={20} height={20} />}
          href="/store/customers"
          loading={loading}
        />
        <DashboardStat
          label="الطلبات"
          value={orders}
          hint={`${newOrders} جديد · ${processingOrders} قيد التنفيذ`}
          tone="ink"
          icon={<ReceiptIcon width={20} height={20} />}
          href="/store/orders"
          loading={loading}
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              مركز إدارة المتجر
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              انتقل مباشرة إلى الوحدة التي تريد إدارتها.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ManagementCard
            title="المنتجات"
            description="إضافة وتعديل وحذف المنتجات وإدارة الصور والمتغيرات."
            icon={<BoxIcon width={20} height={20} />}
            href="/store/products"
            count={products}
            active
          />
          <ManagementCard
            title="التصنيفات"
            description="تنظيم المنتجات داخل تصنيفات رئيسية وفرعية مع الصور."
            icon={<TagIcon width={20} height={20} />}
            href="/store/categories"
            count={categories}
            active
          />
          <ManagementCard
            title="العملاء"
            description="إدارة بيانات العملاء وطلباتهم المرتبطة."
            icon={<UsersIcon width={20} height={20} />}
            href="/store/customers"
            count={customers}
            active
          />
          <ManagementCard
            title="الطلبات"
            description="متابعة حالات الطلبات وقيمتها ودورة التنفيذ."
            icon={<ReceiptIcon width={20} height={20} />}
            href="/store/orders"
            count={orders}
            active
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <RecentOrdersList orders={recentOrders} loading={loading} />
        <RecentCustomersList customers={recentCustomers} loading={loading} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                معلومات الحساب
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                بيانات الحساب والمتجر المرتبط به.
              </p>
            </div>
            <span className="rounded-full bg-success-bg px-3 py-1 text-[11px] font-bold text-success">
              متصل
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <UsersIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">الاسم</p>
                <p className="mt-0.5 truncate font-semibold text-ink">
                  {userName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <PhoneIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">رقم الهاتف</p>
                <p className="mt-0.5 truncate font-semibold text-ink" dir="ltr">
                  {phone ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <MailIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">البريد الإلكتروني</p>
                <p className="mt-0.5 truncate font-semibold text-ink">
                  {email ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <LinkIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">رابط المتجر</p>
                <p className="mt-0.5 truncate font-mono text-sm font-semibold text-brand">
                  /{store.slug}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <CalendarIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">حالة المتجر</p>
                <p className="mt-0.5 font-semibold text-ink">
                  {store.status === "ACTIVE" ? "نشط" : "موقوف"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-ink-soft">
                <CrownIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-soft">الباقة</p>
                <p className="mt-0.5 font-semibold text-ink">
                  {subscription?.plan.name ?? "بدون باقة"}
                </p>
              </div>
            </div>
          </div>
        </article>

        <SubscriptionCard subscription={subscription} />
      </section>
    </div>
  );
}
