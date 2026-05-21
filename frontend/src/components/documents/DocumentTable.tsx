"use client";
import { useState } from "react";
import { Trash2, Eye, RefreshCw, FileText, File, FileCode } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDeleteDocument } from "@/hooks/useDocuments";
import { toastSuccess, toastError } from "@/components/ui/Toaster";
import type { Document } from "@/types/api";

interface DocumentTableProps {
  documents: Document[];
  workspaceId: string;
  onViewChunks: (doc: Document) => void;
}

const FILE_ICONS = { pdf: FileText, docx: File, txt: FileCode };
const STATUS_VARIANT = { READY: "ready", PROCESSING: "processing", UPLOADING: "uploading", FAILED: "failed" } as const;

export function DocumentTable({ documents, workspaceId, onViewChunks }: DocumentTableProps) {
  const deleteDoc = useDeleteDocument(workspaceId);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc.mutateAsync(confirmDelete.id);
      toastSuccess(`${confirmDelete.filename} deleted`);
    } catch {
      toastError("Failed to delete document");
    }
    setConfirmDelete(null);
  };

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-primary font-medium">No documents yet</p>
        <p className="text-sm text-text-muted mt-1">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">File</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Pages</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Size</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Added</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => {
              const Icon = FILE_ICONS[doc.file_type] ?? File;
              return (
                <tr key={doc.id} className="hover:bg-bg-surface/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <div>
                        <p className="font-medium text-text-primary">{doc.filename}</p>
                        <p className="text-xs text-text-muted uppercase">{doc.file_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{doc.page_count ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{doc.file_size_bytes ? formatBytes(doc.file_size_bytes) : "—"}</td>
                  <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.status === "READY" && (
                        <button onClick={() => onViewChunks(doc)} className="p-1.5 rounded hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors" title="View chunks">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {doc.status === "FAILED" && (
                        <button className="p-1.5 rounded hover:bg-bg-surface text-text-muted hover:text-accent-amber transition-colors" title="Retry processing">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(doc)} className="p-1.5 rounded hover:bg-bg-surface text-text-muted hover:text-accent-red transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete document">
        <p className="text-sm text-text-muted mb-4">
          Delete <span className="font-medium text-text-primary">{confirmDelete?.filename}</span>? This removes all extracted chunks and cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteDoc.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
