"use client";
import { X } from "lucide-react";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;
  return <ModalPanel onClose={onClose} title={title} className={className}>{children}</ModalPanel>;
}

// Split out so the dialog hook only runs (and only locks scroll) while open.
function ModalPanel({ onClose, title, children, className }: Omit<ModalProps, "open">) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(dialogRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("modal-appear relative w-full max-w-md rounded-2xl border border-rule bg-white p-6 shadow-elevated focus:outline-none", className)}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-serif text-[22px] leading-tight text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
