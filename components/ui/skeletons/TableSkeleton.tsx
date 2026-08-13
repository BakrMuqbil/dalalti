interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-5">
        <div className="h-5 w-32 animate-pulse rounded bg-line" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-6 py-4"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-line" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-line" />
              <div className="h-3 w-24 animate-pulse rounded bg-line" />
            </div>
            {Array.from({ length: Math.max(0, columns - 2) }).map(
              (_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 w-20 animate-pulse rounded bg-line"
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
