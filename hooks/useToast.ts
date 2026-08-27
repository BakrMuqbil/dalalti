"use client";
import { createContext, useContext } from "react";
export type ToastType = "success" | "error" | "warning" | "info";
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}
export const ToastContext = createContext<ToastContextValue | null>(null);
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast يجب أن يُستخدم داخل ToastProvider");
  }
  return ctx;
}
