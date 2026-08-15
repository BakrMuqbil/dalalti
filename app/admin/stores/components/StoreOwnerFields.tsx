import type { StoreForm } from "../hooks/useAdminStores";

type Props = { form: StoreForm; onChange: (field: keyof StoreForm, value: string) => void };
const inputClass = "w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10";

export function StoreOwnerFields({ form, onChange }: Props) {
  return <section><h3 className="mb-4 font-bold text-ink">بيانات صاحب المتجر</h3><div className="grid gap-4 sm:grid-cols-2">
    <label htmlFor="owner-name"><span className="mb-2 block text-sm font-medium text-ink-soft">الاسم</span><input id="owner-name" required value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="اسم صاحب المتجر" className={inputClass} /></label>
    <label htmlFor="owner-phone"><span className="mb-2 block text-sm font-medium text-ink-soft">رقم الهاتف</span><input id="owner-phone" required type="tel" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="77xxxxxxx" className={inputClass} /></label>
    <label htmlFor="owner-email"><span className="mb-2 block text-sm font-medium text-ink-soft">البريد الإلكتروني</span><input id="owner-email" type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="example@email.com" className={inputClass} /></label>
    <label htmlFor="owner-password"><span className="mb-2 block text-sm font-medium text-ink-soft">كلمة المرور</span><input id="owner-password" required minLength={8} type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="8 أحرف على الأقل" className={inputClass} /></label>
  </div></section>;
}
