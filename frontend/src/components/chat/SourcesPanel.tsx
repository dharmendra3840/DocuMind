"use client";
import { useEffect } from "react";
import { FileText, X } from "lucide-react";
import type { Source } from "@/types/api";

interface SourcesPanelProps {
  source: Source | null;
  onClose: () => void;
}

/** The passage an answer cited. A side panel on desktop, a full-screen sheet on phones. */
export function SourcesPanel({ source, onClose }: SourcesPanelProps) {
  useEffect(() => {
    if (!source) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [source, onClose]);

  if (!source) return null;

  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-paper md:static md:z-auto md:w-96 md:shrink-0 md:border-l md:border-rule" aria-label="Cited passage">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-mono text-[12.5px] text-ink" title={source.filename}>
            <FileText className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            <span className="truncate">{source.filename}</span>
          </p>
          <p className="text-xs text-ink-muted">Page {source.page} · passage {source.chunk_index + 1}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-muted hover:bg-paper-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink" aria-label="Close source">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Cited passage</p>
        <blockquote className="whitespace-pre-wrap rounded-lg border border-rule bg-white px-5 py-4 font-serif text-[15.5px] leading-relaxed text-ink-soft shadow-sm">
          {source.text}
        </blockquote>
      </div>
    </aside>
  );
}
