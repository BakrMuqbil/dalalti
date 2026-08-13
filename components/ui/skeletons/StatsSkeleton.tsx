interface StatsSkeletonProps {
  count?: number;
}

export function StatsSkeleton({ count = 3 }: StatsSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <div className="h-4 w-20 animate-pulse rounded bg-line" />
          <div className="mt-3 h-8 w-16 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}
