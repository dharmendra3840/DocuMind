import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "ready" | "processing" | "failed" | "uploading" | "default";
  children: React.ReactNode;
  className?: string;
}

const VARIANTS = {
  ready: { box: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-600" },
  processing: { box: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500 animate-pulse" },
  failed: { box: "bg-red-50 text-redline border-red-200", dot: "bg-redline" },
  uploading: { box: "bg-paper-deep text-ink-soft border-rule", dot: "bg-ink-muted animate-pulse" },
  default: { box: "bg-paper-deep text-ink-muted border-rule", dot: "" },
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const v = VARIANTS[variant];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium", v.box, className)}>
      {v.dot && <span className={cn("h-1.5 w-1.5 rounded-full", v.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
