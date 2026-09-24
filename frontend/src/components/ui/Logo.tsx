import { cn } from "@/lib/utils";

const SIZES = {
  sm: { mark: "w-5 h-5 text-[13px] rounded-[5px]", text: "text-[13px]" },
  md: { mark: "w-7 h-7 text-[17px] rounded-[7px]", text: "text-[15px]" },
};

const TONES = {
  light: { mark: "bg-ink text-paper", text: "text-ink" },
  dark: { mark: "bg-paper text-ink", text: "text-paper" },
};

export function Logo({
  size = "md",
  tone = "light",
  className,
}: {
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const s = SIZES[size];
  const t = TONES[tone];
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className={cn("flex items-center justify-center font-serif font-semibold leading-none", s.mark, t.mark)} aria-hidden="true">
        D
      </span>
      <span className={cn("font-semibold tracking-tight", s.text, t.text)}>DocuMind</span>
    </span>
  );
}
