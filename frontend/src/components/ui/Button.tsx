import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-ink text-paper hover:bg-ink-soft",
      ghost: "text-ink-muted hover:text-ink hover:bg-paper-deep",
      danger: "bg-redline text-white hover:bg-[#A63418]",
      outline: "border border-rule bg-white text-ink hover:bg-paper",
    };
    const sizes = { sm: "px-3 py-1.5 text-[13px]", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-[15px]" };

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
