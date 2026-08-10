export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderCustomer = {
  id: string;
  name: string;
  phone: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  totalPrice: string;
  product: { id: string; name: string };
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  _count?: { orders: number };
};

export type Product = {
  id: string;
  name: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  status: "ACTIVE" | "INACTIVE";
};

export type Category = {
  id: string;
};

export type DashboardData = {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  orders: Order[];
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التنفيذ",
  READY: "جاهز",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغى",
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 7) return `قبل ${diffDays} يوم`;

  return new Intl.DateTimeFormat("ar-SA", {
    month: "short",
    day: "numeric",
  }).format(date);
}
