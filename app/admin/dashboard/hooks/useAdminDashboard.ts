"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminStats } from "../types";

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحميل بيانات لوحة الإدارة");
      }

      setStats(data.stats);
    } catch (err) {
      console.error("Load admin dashboard failed:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
