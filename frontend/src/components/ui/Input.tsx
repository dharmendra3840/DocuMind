import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}</label>}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full bg-bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-accent-red focus:ring-accent-red",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";
