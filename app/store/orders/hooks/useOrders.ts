"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { readJson, fetchWithAuth } from "@/lib/api-client";
import type {
  DashboardOrder,
  DashboardOrderStatus,
} from "@/app/store/dashboard/hooks/useDashboardData";
export type Order = DashboardOrder;
export type OrderStatus = DashboardOrderStatus;
type OrdersResponse = { success: boolean; message?: string; orders?: Order[] };
export function useOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  async function loadOrders() {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/store/orders?status=${statusFilter}&limit=100`
        : "/api/store/orders?limit=100";
      const response = await fetchWithAuth(url);
      const data = await readJson(response);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Load orders failed:", err);
      showToast(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الطلبات",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadOrders();
  }, [statusFilter]);
  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      setSaving(true);
      const response = await fetchWithAuth(`/api/store/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readJson(response, "فشل تحديث حالة الطلب");
      showToast("تم تحديث حالة الطلب بنجاح", "success");
      await loadOrders();
    } catch (err) {
      console.error("Update status failed:", err);
      showToast(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحديث حالة الطلب",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }
  return {
    orders,
    loading,
    saving,
    statusFilter,
    setStatusFilter,
    updateStatus,
  };
}
