"use client";
import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/api";

const PAGE_SIZE = 20;

interface ChunkViewerProps {
  document: Document | null;
  onClose: () => void;
}

/** Shows how a document was split into passages. Side panel on desktop, full-screen sheet on phones. */
export function ChunkViewer({ document, onClose }: ChunkViewerProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["chunks", document?.id],
    queryFn: ({ pageParam }) => apiClient.getDocumentChunks(document!.id, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.chunks.length, 0);
      return last.chunks.length > 0 && loaded < last.total ? pages.length + 1 : undefined;
    },
    enabled: !!document && document.status === "READY",
  });

  useEffect(() => { setExpanded(new Set()); }, [document?.id]);

  useEffect(() => {
    if (!document) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [document, onClose]);

  if (!document) return null;

  const chunks = data?.pages.flatMap((p) => p.chunks) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const toggle = (i: number) => setExpanded((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-paper md:static md:z-auto md:w-96 md:shrink-0 md:border-l md:border-rule" aria-label={`Passages in ${document.filename}`}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-mono text-[12.5px] text-ink" title={document.filename}>
            <FileText className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            <span className="truncate">{document.filename}</span>
          </p>
          <p className="text-xs text-ink-muted">{isLoading ? "Loading…" : `${total} passage${total === 1 ? "" : "s"}`}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-muted hover:bg-paper-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink" aria-label="Close passages">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {isError && <p className="py-8 text-center text-sm text-redline">Couldn’t load the passages.</p>}
        {!isLoading && !isError && chunks.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-muted">No passages found for this document.</p>
        )}
        {chunks.map((chunk) => {
          const open = expanded.has(chunk.chunk_index);
          return (
            <button
              key={chunk.chunk_index}
              onClick={() => toggle(chunk.chunk_index)}
              aria-expanded={open}
              className="block w-full rounded-lg border border-rule bg-white p-3 text-left transition-colors hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span className="mb-1.5 flex items-center gap-2 font-mono text-[11px] text-ink-muted">
                <span className="text-redline">p.{chunk.page_number}</span>
                <span>passage {chunk.chunk_index + 1}</span>
              </span>
              <span className={cn("block whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-ink-soft", !open && "line-clamp-5")}>{chunk.text}</span>
            </button>
          );
        })}
        {hasNextPage && (
          <Button variant="outline" size="sm" className="w-full" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Load more passages
          </Button>
        )}
      </div>
    </aside>
  );
}
