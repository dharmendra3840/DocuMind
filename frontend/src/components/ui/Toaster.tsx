"use client";
import { useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

let addToastFn: ((msg: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}
export const toastSuccess = (msg: string) => toast(msg, "success");
export const toastError = (msg: string) => toast(msg, "error");

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const COLORS = { success: "text-emerald-700", error: "text-redline", info: "text-ink-soft" };

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => { addToastFn = add; return () => { addToastFn = null; }; }, [add]);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-80" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-rule bg-white p-4 shadow-elevated">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLORS[t.type])} aria-hidden="true" />
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="rounded text-ink-muted hover:text-ink" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
