import { cn } from "@/lib/utils";

const SIZES = {
  sm: { mark: "w-5 h-5 text-[9px]", text: "text-xs font-semibold text-text-muted" },
  md: { mark: "w-7 h-7 text-xs shadow-md shadow-accent/30", text: "text-sm font-bold text-text-primary" },
};

export function Logo({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className={cn("rounded-full bg-accent flex items-center justify-center text-white font-black", s.mark)} aria-hidden="true">
        D
      </span>
      <span className={cn("tracking-tight", s.text)}>DocuMind</span>
    </span>
  );
}
