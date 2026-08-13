import { useCallback, useEffect, useState } from "react";
import { readJson, fetchWithAuth } from "@/lib/api-client";

export type DashboardOrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type DashboardOrder = {
  id: string;
  status: DashboardOrderStatus;
  totalAmount: string | number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: { id: string; name: string };
    variant?: { id: string; color?: string | null; size?: string | null } | null;
  }>;
};

export type DashboardCustomer = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  _count?: { orders: number };
};

export type DashboardData = {
  products: number;
  categories: number;
  customers: number;
  orders: number;
  newOrders: number;
  processingOrders: number;
  deliveredRevenue: number;
  unavailableProducts: number;
  recentOrders: DashboardOrder[];
  recentCustomers: DashboardCustomer[];
};

const emptyData: DashboardData = {
  products: 0,
  categories: 0,
  customers: 0,
  orders: 0,
  newOrders: 0,
  processingOrders: 0,
  deliveredRevenue: 0,
  unavailableProducts: 0,
  recentOrders: [],
  recentCustomers: [],
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url);
  return readJson(response, "تعذر تحميل بيانات لوحة التحكم") as Promise<T>;
}

type CollectionResponse<T> = {
  success: boolean;
  [key: string]: unknown;
  items?: T[];
};

type ProductsResponse = CollectionResponse<{
  id: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
}> & {
  products: Array<{
    id: string;
    availability: "AVAILABLE" | "UNAVAILABLE";
  }>;
};

type CategoriesResponse = CollectionResponse<unknown> & {
  categories: unknown[];
};

type CustomersResponse = CollectionResponse<DashboardCustomer> & {
  customers: DashboardCustomer[];
};

type OrdersResponse = CollectionResponse<DashboardOrder> & {
  orders: DashboardOrder[];
};

function toNumber(value: string | number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [
        productsResponse,
        categoriesResponse,
        customersResponse,
        ordersResponse,
        newOrdersResponse,
        processingOrdersResponse,
        deliveredOrdersResponse,
      ] = await Promise.all([
        fetchJson<ProductsResponse>("/api/store/products"),
        fetchJson<CategoriesResponse>("/api/store/categories"),
        fetchJson<CustomersResponse>("/api/store/customers?limit=100"),
        fetchJson<OrdersResponse>("/api/store/orders?limit=100"),
        fetchJson<OrdersResponse>("/api/store/orders?status=NEW&limit=100"),
        fetchJson<OrdersResponse>(
          "/api/store/orders?status=PROCESSING&limit=100",
        ),
        fetchJson<OrdersResponse>(
          "/api/store/orders?status=DELIVERED&limit=100",
        ),
      ]);

      const products = productsResponse.products ?? [];
      const categories = categoriesResponse.categories ?? [];
      const customers = customersResponse.customers ?? [];
      const orders = ordersResponse.orders ?? [];
      const newOrders = newOrdersResponse.orders ?? [];
      const processingOrders = processingOrdersResponse.orders ?? [];
      const deliveredOrders = deliveredOrdersResponse.orders ?? [];

      const deliveredRevenue = deliveredOrders.reduce(
        (sum, order) => sum + toNumber(order.totalAmount),
        0,
      );

      setData({
        products: products.length,
        categories:
        categories.length,
        customers: customers.length,
        orders: orders.length,
        newOrders: newOrders.length,
        processingOrders: processingOrders.length,
        deliveredRevenue,
        unavailableProducts: products.filter(
          (product) => product.availability === "UNAVAILABLE",
        ).length,
        recentOrders: orders.slice(0, 5),
        recentCustomers: customers.slice(0, 5),
      });
    } catch (loadError) {
      console.error("Load dashboard data failed:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل بيانات لوحة التحكم",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    ...data,
    loading,
    refreshing,
    error,
    refresh: () => loadDashboard(true),
  };
}
