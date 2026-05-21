"use client";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Document } from "@/types/api";

interface ChunkViewerProps {
  document: Document | null;
  onClose: () => void;
}

export function ChunkViewer({ document, onClose }: ChunkViewerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["chunks", document?.id],
    queryFn: () => apiClient.getDocumentChunks(document!.id),
    enabled: !!document && document.status === "READY",
  });

  if (!document) return null;

  return (
    <div className="w-80 border-l border-border bg-bg-secondary flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium text-text-primary truncate">{document.filename}</p>
          <p className="text-xs text-text-muted">{data?.total ?? 0} chunks</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <div className="text-sm text-text-muted text-center py-8">Loading chunks...</div>}
        {data?.chunks.map((chunk) => (
          <div key={chunk.chunk_index} className="bg-bg-primary border border-border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-accent font-mono">p.{chunk.page_number}</span>
              <span className="text-xs text-text-muted">chunk #{chunk.chunk_index}</span>
            </div>
            <p className="text-xs text-text-muted font-mono leading-relaxed line-clamp-6">{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
