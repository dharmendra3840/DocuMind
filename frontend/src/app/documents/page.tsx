"use client";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useDocuments } from "@/hooks/useDocuments";
import { UploadZone } from "@/components/documents/UploadZone";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ChunkViewer } from "@/components/documents/ChunkViewer";
import { TopBar } from "@/components/layout/TopBar";
import AppLayout from "@/components/layout/AppLayout";
import type { Document } from "@/types/api";

function DocumentsPage() {
  const { activeWorkspaceId } = useAppStore();
  const { data, isLoading } = useDocuments(activeWorkspaceId);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Documents" />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeWorkspaceId ? (
            <>
              <UploadZone workspaceId={activeWorkspaceId} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-text-primary">
                    {isLoading ? "Loading..." : `${data?.total ?? 0} documents`}
                  </h2>
                </div>
                <DocumentTable
                  documents={data?.documents ?? []}
                  workspaceId={activeWorkspaceId}
                  onViewChunks={setSelectedDoc}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-text-muted">Select a workspace to manage documents</div>
          )}
        </div>
        <ChunkViewer document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      </div>
    </div>
  );
}

export default function DocumentsRoute() {
  return <AppLayout><DocumentsPage /></AppLayout>;
}
