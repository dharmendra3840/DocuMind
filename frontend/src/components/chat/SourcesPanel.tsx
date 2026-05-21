"use client";
import { X } from "lucide-react";
import type { Source } from "@/types/api";

interface SourcesPanelProps {
  source: Source | null;
  onClose: () => void;
}

export function SourcesPanel({ source, onClose }: SourcesPanelProps) {
  if (!source) return null;

  return (
    <div className="w-80 border-l border-border bg-bg-secondary flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium text-text-primary truncate">{source.filename}</p>
          <p className="text-xs text-text-muted">Page {source.page} · Chunk #{source.chunk_index}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-bg-primary border border-accent/30 rounded-lg p-4">
          <p className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">{source.text}</p>
        </div>
      </div>
    </div>
  );
}
