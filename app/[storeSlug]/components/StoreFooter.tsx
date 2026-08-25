type Props = { storeName: string; storeSlug: string; phone: string | null };

export function StoreFooter({ storeName, storeSlug, phone }: Props) {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-xl font-bold text-ink">{storeName}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-ink-soft">
            تسوّق بسهولة واكتشف المنتجات المتاحة في متجرنا.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">المتجر</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <a href={`/${storeSlug}#products`} className="hover:text-brand">المنتجات</a>
            <a href={`/${storeSlug}#categories`} className="hover:text-brand">الفئات</a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">الحساب والتواصل</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <a href={`/${storeSlug}/account`} className="hover:text-brand">حسابي وطلباتي</a>
            {phone && (
              <a href={`tel:${phone}`} className="hover:text-brand" dir="ltr">{phone}</a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>{storeName} — جميع الحقوق محفوظة</span>
          <span>مدعوم بواسطة <span className="font-semibold text-brand">دلالتي</span></span>
        </div>
      </div>
    </footer>
  );
}
