"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastViewport, type ToastItem, type ToastVariant } from "@/components/ui/toast";
import "@/components/ui/toast.css";

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  push: (input: ToastInput) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  reward: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3200,
  error: 4500,
  info: 3000,
  reward: 4000,
};

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast hors ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    ({ message, variant = "info", duration }: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, message, variant };
      setToasts((prev) => [...prev.slice(-4), item]);
      const ms = duration ?? DEFAULT_DURATION[variant];
      const timer = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      dismiss,
      success: (message, duration) => push({ message, variant: "success", duration }),
      error: (message, duration) => push({ message, variant: "error", duration }),
      info: (message, duration) => push({ message, variant: "info", duration }),
      reward: (message, duration) => push({ message, variant: "reward", duration }),
    }),
    [push, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}
