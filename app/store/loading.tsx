import { StatsSkeleton } from "@/components/ui/skeletons/StatsSkeleton";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";

export default function GlobalStoreLoading() {
    return (
        <div className="mx-auto max-w-7xl px-6 py-8 space-y-6 animate-pulse">
            {/* 1. التروية العامة للتحميل (العنوان والوصف) */}
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-line" />
                <div className="h-4 w-72 rounded bg-line" />
            </div>

            {/* 2. بطاقات الإحصائيات الشاملة */}
            <StatsSkeleton count={3} />

            {/* 3. هيكل الجدول أو المحتوى الرئيسي */}
            <TableSkeleton rows={5} columns={4} />
        </div>
    );
}
