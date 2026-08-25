'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, FilterIcon, ChevronDownIcon, XIcon } from '@/components/icons';

type Props = {
  storeSlug: string;
  initialQuery: string;
  initialSort: string;
  initialAvailability: string;
  productCount: number;
};

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'الأقل سعراً' },
  { value: 'price-desc', label: 'الأعلى سعراً' },
  { value: 'name', label: 'الاسم' },
];

export function ProductFilterBar({ storeSlug, initialQuery, initialSort, initialAvailability, productCount }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort || 'newest');
  const [availability, setAvailability] = useState(initialAvailability || 'all');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateUrl = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    router.push(url.pathname + url.search, { scroll: false });
  }, [router]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => updateUrl({ q: value }), 300);
  };

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const applyAvailability = (value: string) => {
    setAvailability(value);
    updateUrl({ availability: value });
  };

  return (
    <section className="mb-7 scroll-mt-24" id="products" aria-label="اكتشاف المنتجات">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold">اكتشف المنتجات</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">كل المنتجات</h2>
        </div>
        <span className="text-sm text-ink-soft">{productCount} منتج</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full rounded-xl border border-line bg-surface py-3 pr-10 pl-4 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/15"
            aria-label="البحث في المنتجات"
          />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" onClick={() => applyAvailability('all')} className={`rounded-xl px-4 py-3 text-sm font-medium transition ${availability === 'all' ? 'bg-brand text-white' : 'border border-line bg-surface text-ink-soft hover:border-gold'}`} aria-pressed={availability === 'all'}>الكل</button>
          <button type="button" onClick={() => applyAvailability('available')} className={`rounded-xl px-4 py-3 text-sm font-medium transition ${availability === 'available' ? 'bg-success text-white' : 'border border-line bg-surface text-ink-soft hover:border-gold'}`} aria-pressed={availability === 'available'}>متوفر</button>
        </div>

        <div className="relative hidden sm:block">
          <button type="button" onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-gold" aria-haspopup="listbox" aria-expanded={isSortOpen}>
            {sortOptions.find((o) => o.value === sort)?.label || 'الأحدث'}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>
          {isSortOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-line bg-surface p-1 shadow-xl" role="listbox">
              {sortOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => { setSort(option.value); setIsSortOpen(false); updateUrl({ sort: option.value }); }} className={`block w-full rounded-lg px-4 py-2.5 text-right text-sm ${sort === option.value ? 'bg-gold-soft/20 font-semibold text-brand-deep' : 'text-ink-soft hover:bg-background'}`} role="option" aria-selected={sort === option.value}>{option.label}</button>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={() => setIsFilterOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink sm:hidden">
          <FilterIcon className="h-4 w-4" /> فلترة وترتيب
        </button>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button aria-label="إغلاق الفلاتر" className="absolute inset-0 bg-black/35" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">فلترة المنتجات</h3>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-background" aria-label="إغلاق">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-2 text-sm font-semibold text-ink">التوفر</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => applyAvailability('all')} className={`rounded-xl border px-4 py-3 text-sm ${availability === 'all' ? 'border-brand bg-brand text-white' : 'border-line text-ink-soft'}`}>الكل</button>
              <button type="button" onClick={() => applyAvailability('available')} className={`rounded-xl border px-4 py-3 text-sm ${availability === 'available' ? 'border-success bg-success text-white' : 'border-line text-ink-soft'}`}>متوفر فقط</button>
            </div>
            <p className="mb-2 mt-5 text-sm font-semibold text-ink">الترتيب</p>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => { setSort(option.value); updateUrl({ sort: option.value }); setIsFilterOpen(false); }} className={`rounded-xl border px-4 py-3 text-sm ${sort === option.value ? 'border-brand bg-brand text-white' : 'border-line text-ink-soft'}`}>{option.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
