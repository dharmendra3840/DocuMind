import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-accent hover:bg-indigo-400 text-white",
      ghost: "text-text-muted hover:text-text-primary hover:bg-bg-surface",
      danger: "bg-accent-red hover:bg-red-400 text-white",
      outline: "border border-border text-text-primary hover:bg-bg-surface",
    };
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
