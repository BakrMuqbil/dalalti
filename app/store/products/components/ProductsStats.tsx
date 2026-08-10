import { Card } from "@/components/ui/Card";

interface ProductsStatsProps {
  loading: boolean;
  total: number;
  active: number;
  available: number;
}

export function ProductsStats({
  loading,
  total,
  active,
  available,
}: ProductsStatsProps) {
  const stats = [
    { label: "إجمالي المنتجات", value: total, color: "text-ink" },
    { label: "المنتجات النشطة", value: active, color: "text-brand" },
    { label: "المتوفرة", value: available, color: "text-success" },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <p className="text-sm text-ink-soft">{stat.label}</p>
          <p className={`mt-2 text-3xl font-semibold font-display ${stat.color}`}>
            {loading ? "..." : stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
