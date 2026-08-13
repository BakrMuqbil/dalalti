"use client";

import { createContext, useContext } from "react";

export type AdminIdentity = {
  userId: string;
  userName: string;
  email: string | null;
  role: "ADMIN";
};

const AdminIdentityContext = createContext<AdminIdentity | null>(null);

export function AdminIdentityProvider({
  value,
  children,
}: {
  value: AdminIdentity;
  children: React.ReactNode;
}) {
  return (
    <AdminIdentityContext.Provider value={value}>
      {children}
    </AdminIdentityContext.Provider>
  );
}

/**
 * هوك للوصول لبيانات المشرف من أي صفحة تحت /admin.
 * البيانات تُجلب مرة واحدة فقط في app/admin/layout.tsx على مستوى السيرفر.
 */
export function useAdminIdentity() {
  const identity = useContext(AdminIdentityContext);

  if (!identity) {
    throw new Error(
      "useAdminIdentity يجب أن يُستخدم داخل صفحات /admin (تحت AdminIdentityProvider)",
    );
  }

  return identity;
}
