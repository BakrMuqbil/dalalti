import { StatsSkeleton } from "@/components/ui/skeletons/StatsSkeleton";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
export function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {" "}
      <StatsSkeleton count={3} /> <TableSkeleton rows={5} columns={6} />{" "}
    </div>
  );
}
