import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-[13px] font-medium text-ink">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70",
          "transition-[border-color,box-shadow] focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-ink/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-redline focus:border-redline focus:ring-redline/15",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-redline">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";
