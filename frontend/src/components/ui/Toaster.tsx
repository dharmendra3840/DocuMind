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

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => { addToastFn = add; return () => { addToastFn = null; }; }, [add]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = { success: "text-accent-green", error: "text-accent-red", info: "text-accent" };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className="flex items-start gap-3 bg-bg-secondary border border-border rounded-lg p-4 shadow-elevated animate-in slide-in-from-right-2">
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", colors[t.type])} />
            <p className="text-sm text-text-primary flex-1">{t.message}</p>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-text-muted hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
