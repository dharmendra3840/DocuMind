"use client";
import { useState } from "react";
import { Trash2, Eye, FileText, File, FileCode } from "lucide-react";
import { formatBytes, formatDate, getErrorMessage } from "@/lib/utils";
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
const STATUS_LABEL = { READY: "Ready", PROCESSING: "Indexing", UPLOADING: "Uploading", FAILED: "Failed" };

const th = "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-muted";
const iconButton = "rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

export function DocumentTable({ documents, workspaceId, onViewChunks }: DocumentTableProps) {
  const deleteDoc = useDeleteDocument(workspaceId);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc.mutateAsync(confirmDelete.id);
      toastSuccess(`${confirmDelete.filename} deleted`);
      setConfirmDelete(null);
    } catch (err) {
      toastError(getErrorMessage(err, "Couldn't delete the document"));
    }
  };

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rule bg-white px-6 py-16 text-center">
        <FileText className="mb-3 h-7 w-7 text-ink-muted" strokeWidth={1.5} />
        <p className="font-medium text-ink">No documents yet</p>
        <p className="mt-1 text-sm text-ink-muted">Upload your first file above — you can ask questions as soon as it’s indexed.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-rule bg-white">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-rule bg-paper/60">
            <tr>
              <th className={th}>File</th>
              <th className={`${th} hidden w-32 sm:table-cell`}>Status</th>
              <th className={`${th} hidden w-20 md:table-cell`}>Pages</th>
              <th className={`${th} hidden w-24 lg:table-cell`}>Size</th>
              <th className={`${th} hidden w-32 lg:table-cell`}>Added</th>
              <th className={`${th} w-[5.5rem] text-right`}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {documents.map((doc) => {
              const Icon = FILE_ICONS[doc.file_type] ?? File;
              return (
                <tr key={doc.id} className="group transition-colors hover:bg-paper/50">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink" title={doc.filename}>{doc.filename}</p>
                        <p className="text-xs uppercase text-ink-muted">
                          {doc.file_type}
                          {doc.chunk_count ? <span className="normal-case"> · {doc.chunk_count} passages</span> : null}
                        </p>
                        {/* Phones: status sits under the name instead of in its own column. */}
                        <Badge variant={STATUS_VARIANT[doc.status]} className="mt-1 sm:hidden">{STATUS_LABEL[doc.status]}</Badge>
                        {doc.status === "FAILED" && doc.error_message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-redline" title={doc.error_message}>{doc.error_message}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge variant={STATUS_VARIANT[doc.status]}>{STATUS_LABEL[doc.status]}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums text-ink-muted md:table-cell">{doc.page_count ?? "—"}</td>
                  <td className="hidden px-4 py-3 tabular-nums text-ink-muted lg:table-cell">{doc.file_size_bytes ? formatBytes(doc.file_size_bytes) : "—"}</td>
                  <td className="hidden px-4 py-3 text-ink-muted lg:table-cell">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    {/* Always visible on touch screens; revealed on hover/focus with a mouse. */}
                    <div className="flex items-center justify-end gap-1 md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100">
                      {doc.status === "READY" && (
                        <button onClick={() => onViewChunks(doc)} className={`${iconButton} hover:text-ink`} aria-label={`View passages in ${doc.filename}`} title="View passages">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(doc)} className={`${iconButton} hover:text-redline`} aria-label={`Delete ${doc.filename}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete document?">
        <p className="mb-5 text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{confirmDelete?.filename}</span> and its indexed passages will be removed. Past answers that cited it keep their text, but you can’t ask about it any more.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteDoc.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
