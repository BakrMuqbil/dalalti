"use client";

import { createContext, useContext } from "react";

export type StoreIdentity = {
  userId: string;
  userName: string;
  phone: string | null;
  email: string | null;

  store: {
    id: string;
    name: string;
    slug: string;
    status: "ACTIVE" | "SUSPENDED";
  };

  subscription: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    startsAt: string;
    endsAt: string;
    plan: {
      id: string;
      name: string;
      billingPeriod: "MONTHLY" | "YEARLY";
      price: string;
    };
  } | null;
};

const StoreIdentityContext = createContext<StoreIdentity | null>(null);

export function StoreIdentityProvider({
  value,
  children,
}: {
  value: StoreIdentity;
  children: React.ReactNode;
}) {
  return (
    <StoreIdentityContext.Provider value={value}>
      {children}
    </StoreIdentityContext.Provider>
  );
}

/**
 * هوك للوصول لبيانات المتجر وصاحبه من أي صفحة تحت /store
 * بدون الحاجة لعمل fetch("/api/auth/me") بشكل مستقل — البيانات
 * تُجلب مرة واحدة فقط في app/store/layout.tsx على مستوى السيرفر.
 */
export function useStoreIdentity() {
  const identity = useContext(StoreIdentityContext);

  if (!identity) {
    throw new Error(
      "useStoreIdentity يجب أن يُستخدم داخل صفحات /store (تحت StoreIdentityProvider)",
    );
  }

  return identity;
}
