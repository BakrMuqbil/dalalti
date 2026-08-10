import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreOwner } from "@/lib/require-auth";
import { StoreIdentityProvider } from "./components/StoreIdentityContext";
import { StoreHeader } from "./components/StoreHeader";

/**
 * Layout مشترك لكل مسارات /store/* (dashboard, products, categories, ...).
 *
 * لماذا هذا الملف موجود:
 * سابقًا، كل صفحة كانت تجلب هوية المستخدم بشكل مستقل عبر
 * fetch("/api/auth/me") من المتصفح، وتعرض StoreHeader بعد وصول
 * الاستجابة. هذا كان يسبب اختفاء الهيدر ثم ظهوره من جديد (وميض)
 * عند كل تنقل بين الصفحات، لأن كل صفحة "تعيد تركيب" الهيدر من الصفر.
 *
 * الحل: نجلب بيانات المستخدم والمتجر مرة واحدة فقط هنا، على مستوى
 * السيرفر (بدون أي طلب من المتصفح، صفر وميض)، ثم نمررها لكل الصفحات
 * الفرعية عبر Context. الـ Next.js App Router يبقي هذا الـ layout
 * (وبالتالي الهيدر) ثابتًا في الذاكرة أثناء التنقل بين الصفحات؛
 * فقط محتوى page.tsx الداخلي يتغير.
 */
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireStoreOwner();

  if (!auth) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      store: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
  });

  if (!user || !user.store) {
    redirect("/login");
  }

  const identity = {
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    email: user.email,

    store: {
      id: user.store.id,
      name: user.store.name,
      slug: user.store.slug,
      status: user.store.status,
    },

    subscription: user.store.subscription
      ? {
          id: user.store.subscription.id,
          status: user.store.subscription.status,
          startsAt: user.store.subscription.startsAt.toISOString(),
          endsAt: user.store.subscription.endsAt.toISOString(),

          plan: {
            id: user.store.subscription.plan.id,
            name: user.store.subscription.plan.name,
            billingPeriod: user.store.subscription.plan.billingPeriod,
            price: user.store.subscription.plan.price.toString(),
          },
        }
      : null,
  };

  return (
    <StoreIdentityProvider value={identity}>
      <div className="min-h-screen bg-background">
        <StoreHeader />
        {children}
      </div>
    </StoreIdentityProvider>
  );
}
