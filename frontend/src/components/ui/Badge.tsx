import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "ready" | "processing" | "failed" | "uploading" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const variants = {
    ready: "bg-emerald-500/20 text-accent-green border-accent-green/30",
    processing: "bg-amber-500/20 text-accent-amber border-accent-amber/30",
    failed: "bg-red-500/20 text-accent-red border-accent-red/30",
    uploading: "bg-indigo-500/20 text-accent border-accent/30",
    default: "bg-bg-surface text-text-muted border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border", variants[variant], className)}>
      {variant === "processing" && <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />}
      {variant === "ready" && <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />}
      {variant === "failed" && <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />}
      {children}
    </span>
  );
}
