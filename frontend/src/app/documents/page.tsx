"use client";
import { useCallback, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useDocuments, DOCUMENT_PAGE_SIZE } from "@/hooks/useDocuments";
import { UploadZone } from "@/components/documents/UploadZone";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ChunkViewer } from "@/components/documents/ChunkViewer";
import { TopBar } from "@/components/layout/TopBar";
import type { Document } from "@/types/api";

export default function DocumentsPage() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const { data, isLoading, isError } = useDocuments(activeWorkspaceId);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const closeViewer = useCallback(() => setSelectedDoc(null), []);
  const total = data?.total ?? 0;
  const shown = data?.documents.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Documents" />
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
            <div>
              <h1 className="font-serif text-[32px] leading-tight tracking-[-0.02em] text-ink">Documents</h1>
              <p className="mt-1 text-[15px] text-ink-muted">Files in this workspace are indexed so you can ask questions across them.</p>
            </div>

            {activeWorkspaceId ? (
              <>
                <UploadZone workspaceId={activeWorkspaceId} />
                <section aria-labelledby="doc-list-heading">
                  <h2 id="doc-list-heading" className="mb-3 text-sm font-medium text-ink">
                    {isLoading ? "Loading documents…" : `${total} document${total === 1 ? "" : "s"}`}
                  </h2>
                  {isError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-redline">Couldn’t load documents. Refresh to try again.</p>
                  ) : (
                    <DocumentTable documents={data?.documents ?? []} workspaceId={activeWorkspaceId} onViewChunks={setSelectedDoc} />
                  )}
                  {total > shown && shown === DOCUMENT_PAGE_SIZE && (
                    <p className="mt-3 text-xs text-ink-muted">Showing the {shown} most recent of {total} documents.</p>
                  )}
                </section>
              </>
            ) : (
              <p className="rounded-xl border border-rule bg-white px-4 py-10 text-center text-ink-muted">Select a workspace to manage its documents.</p>
            )}
          </div>
        </div>
        <ChunkViewer document={selectedDoc} onClose={closeViewer} />
      </div>
    </div>
  );
}
