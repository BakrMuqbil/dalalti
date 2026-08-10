import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvailabilityBadge, StatusBadge } from "@/components/ui/Badge";
import { Product, formatDate } from "../types";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  deletingId: string | null;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductsTable({
  products,
  loading,
  deletingId,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <h2 className="font-display font-semibold text-ink">منتجات المتجر</h2>
          <p className="mt-1 text-sm text-ink-soft">
            المنتجات المرتبطة بمتجرك فقط
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          تحديث
        </Button>
      </CardHeader>

      {loading ? (
        <div className="p-12 text-center text-sm text-ink-soft">
          جاري تحميل المنتجات...
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-4xl">📦</div>
          <p className="mt-4 font-semibold text-ink">لا توجد منتجات</p>
          <p className="mt-2 text-sm text-ink-soft">أضف أول منتج إلى متجرك.</p>
          <Button className="mt-5" onClick={onCreate}>
            إضافة أول منتج
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead className="bg-background">
              <tr className="border-b border-line">
                {[
                  "المنتج",
                  "التصنيف",
                  "السعر",
                  "التوفر",
                  "الحالة",
                  "آخر تحديث",
                  "الإجراءات",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-xs font-medium text-ink-soft"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-line last:border-b-0 hover:bg-background/60"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-line object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background text-xl">
                          📦
                        </div>
                      )}

                      <div>
                        <div className="font-medium text-ink">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="mt-1 max-w-xs truncate text-xs text-ink-soft">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-ink-soft">
                    {product.category?.name ?? "بدون تصنيف"}
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-mono font-medium text-ink">
                      {product.price}
                    </span>
                    <span className="mr-1 text-xs text-ink-soft">ريال</span>
                  </td>

                  <td className="px-6 py-5">
                    <AvailabilityBadge availability={product.availability} />
                  </td>

                  <td className="px-6 py-5">
                    <StatusBadge status={product.status} />
                  </td>

                  <td className="px-6 py-5 text-sm text-ink-soft">
                    {formatDate(product.updatedAt)}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        تعديل
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? "جاري الحذف..." : "حذف"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
