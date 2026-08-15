"use client";

import { Pagination } from "../hooks/useAdminStores";

interface StoresPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function StoresPagination({
  pagination,
  onPageChange,
}: StoresPaginationProps) {
  const { page, pages, total, limit } = pagination;

  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const nums: (number | string)[] = [];
    const maxVisible = 5;

    if (pages <= maxVisible) {
      for (let i = 1; i <= pages; i++) nums.push(i);
      return nums;
    }

    // Always show first page
    nums.push(1);

    let startPage = Math.max(2, page - 1);
    let endPage = Math.min(pages - 1, page + 1);

    if (page <= 3) {
      startPage = 2;
      endPage = Math.min(4, pages - 1);
    } else if (page >= pages - 2) {
      startPage = Math.max(2, pages - 3);
      endPage = pages - 1;
    }

    if (startPage > 2) nums.push("...");

    for (let i = startPage; i <= endPage; i++) nums.push(i);

    if (endPage < pages - 1) nums.push("...");

    // Always show last page
    if (pages > 1) nums.push(pages);

    return nums;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-ink-soft">
        عرض <span className="font-medium text-ink">{start}</span> إلى{" "}
        <span className="font-medium text-ink">{end}</span> من{" "}
        <span className="font-medium text-ink">{total}</span> متجر
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-line px-3 py-2 text-sm transition hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent"
        >
          السابق
        </button>

        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <span
              key={`dots-${idx}`}
              className="px-2 py-2 text-sm text-ink-soft"
            >
              ...
            </span>
          ) : (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num as number)}
              className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
                num === page
                  ? "bg-brand text-white"
                  : "border border-line hover:bg-background"
              }`}
            >
              {num}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-line px-3 py-2 text-sm transition hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
