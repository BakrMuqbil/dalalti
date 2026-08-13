"use client";

import { useCallback, useEffect, useState } from "react";
import { readJson, fetchWithAuth } from "@/lib/api-client";
import { AdminStats } from "../types";

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth("/api/admin/dashboard");
      const data = await readJson<{ stats: AdminStats }>(response, "فشل تحميل بيانات لوحة الإدارة");

      setStats(data.stats);
    } catch (err) {
      console.error("Load admin dashboard failed:", err);
      const msg =
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
