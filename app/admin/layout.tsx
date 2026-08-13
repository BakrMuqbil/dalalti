import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { AdminIdentityProvider } from "./components/AdminIdentityContext";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AdminHeader } from "./components/AdminHeader";

/**
 * Layout مشترك لكل مسارات /admin/* (dashboard, stores, plans).
 *
 * لماذا هذا الملف موجود:
 * نجلب بيانات المشرف مرة واحدة فقط هنا، على مستوى السيرفر،
 * ثم نمررها لكل الصفحات الفرعية عبر Context. الـ Next.js App Router
 * يبقي هذا الـ layout (وبالتالي الهيدر) ثابتًا في الذاكرة أثناء
 * التنقل بين الصفحات؛ فقط محتوى page.tsx الداخلي يتغير.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();

  if (!auth) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user) {
    redirect("/login");
  }

  const identity = {
    userId: user.id,
    userName: user.name,
    email: user.email,
    role: "ADMIN" as const,
  };

  return (
    <AdminIdentityProvider value={identity}>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <AdminHeader />
          {children}
        </div>
      </ToastProvider>
    </AdminIdentityProvider>
  );
}
