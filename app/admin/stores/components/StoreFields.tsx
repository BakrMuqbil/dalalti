import type { StoreForm } from "../hooks/useAdminStores";

type Props = { form: StoreForm; onChange: (field: keyof StoreForm, value: string) => void };
const inputClass = "w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/10";

export function StoreFields({ form, onChange }: Props) {
  return <section className="border-t border-line pt-6"><h3 className="mb-4 font-bold text-ink">بيانات المتجر</h3><div className="grid gap-4 sm:grid-cols-2">
    <label><span className="mb-2 block text-sm font-medium text-ink-soft">اسم المتجر</span><input required value={form.storeName} onChange={(e) => onChange("storeName", e.target.value)} placeholder="متجر دلالتي" className={inputClass} /></label>
    <label><span className="mb-2 block text-sm font-medium text-ink-soft">رابط المتجر</span><div className="flex items-center overflow-hidden rounded-xl border border-line bg-background focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10"><span className="bg-surface-alt px-3 text-sm text-ink-soft/80">/</span><input required value={form.slug} onChange={(e) => onChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="my-store" className="w-full bg-transparent px-3 py-3 text-sm outline-none" /></div></label>
  </div></section>;
}
