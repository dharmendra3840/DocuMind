"use client";
import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, X, FileText, File, FileCode, Check, AlertCircle } from "lucide-react";
import { cn, formatBytes, getErrorMessage } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toastSuccess, toastError } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";

interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const FILE_ICONS: Record<string, React.FC<{ className?: string }>> = { pdf: FileText, docx: File, txt: FileCode };
const MAX_BYTES = 50 * 1024 * 1024;

function rejectionMessage(r: FileRejection) {
  const code = r.errors[0]?.code;
  if (code === "file-too-large") return `${r.file.name} is larger than 50 MB`;
  if (code === "file-invalid-type") return `${r.file.name} isn't a PDF, DOCX, or TXT file`;
  return `${r.file.name}: ${r.errors[0]?.message ?? "can't be uploaded"}`;
}

export function UploadZone({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Items are addressed by id, not index, so removing one mid-upload can't
  // attach progress or errors to the wrong file.
  const patch = (id: string, changes: Partial<FileUploadItem>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)));

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, progress: 0, status: "pending" as const })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: MAX_BYTES,
    disabled: uploading,
    onDropRejected: (rejections) => rejections.forEach((r) => toastError(rejectionMessage(r))),
  });

  const uploadAll = async () => {
    const queue = files.filter((f) => f.status === "pending");
    if (!queue.length) return;
    setUploading(true);
    let succeeded = 0;

    for (const item of queue) {
      patch(item.id, { status: "uploading", progress: 0 });
      try {
        await apiClient.uploadDocument(item.file, workspaceId, (progress) => patch(item.id, { progress }));
        patch(item.id, { status: "done", progress: 100 });
        succeeded++;
      } catch (err: unknown) {
        patch(item.id, { status: "error", error: getErrorMessage(err, "Upload failed") });
      }
    }

    qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
    setUploading(false);
    const failed = queue.length - succeeded;
    if (succeeded && !failed) toastSuccess(`${succeeded} file${succeeded === 1 ? "" : "s"} uploaded — indexing has started`);
    else if (succeeded) toastError(`${succeeded} uploaded, ${failed} failed — see the list for details`);
    else toastError(failed === 1 ? "The upload failed — see the list for details" : `All ${failed} uploads failed — see the list for details`);
    // Finished rows disappear once they show up in the table below.
    setTimeout(() => setFiles((prev) => prev.filter((f) => f.status !== "done")), 1500);
  };

  const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "txt";
  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
          isDragActive ? "border-ink bg-white" : "border-rule bg-white/60 hover:border-ink/40 hover:bg-white",
          uploading && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} aria-label="Upload documents" />
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-rule bg-paper">
          <Upload className="h-5 w-5 text-ink" strokeWidth={1.75} />
        </span>
        <p className="text-[15px] font-medium text-ink">{isDragActive ? "Drop files to add them" : "Drag files here, or click to browse"}</p>
        <p className="mt-1 text-[13px] text-ink-muted">PDF, DOCX, or TXT · up to 50 MB each</p>
      </div>

      {files.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-rule bg-white">
          <ul className="divide-y divide-rule">
            {files.map((item) => {
              const Icon = FILE_ICONS[ext(item.file.name)] ?? File;
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink" title={item.file.name}>{item.file.name}</p>
                    <p className="text-xs text-ink-muted">{formatBytes(item.file.size)}</p>
                    {item.status === "uploading" && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-ink transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                    {item.status === "error" && <p className="mt-0.5 flex items-center gap-1 text-xs text-redline"><AlertCircle className="h-3 w-3" />{item.error}</p>}
                  </div>
                  {item.status === "done" && <span className="flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3.5 w-3.5" />Uploaded</span>}
                  {item.status === "uploading" && <span className="text-xs tabular-nums text-ink-muted">{item.progress}%</span>}
                  {(item.status === "pending" || item.status === "error") && !uploading && (
                    <button onClick={() => setFiles((p) => p.filter((f) => f.id !== item.id))} className="rounded p-1 text-ink-muted hover:bg-paper hover:text-redline" aria-label={`Remove ${item.file.name}`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2 border-t border-rule bg-paper/50 px-4 py-3">
            <Button variant="ghost" size="sm" disabled={uploading} onClick={() => setFiles([])}>Clear</Button>
            <Button size="sm" loading={uploading} onClick={uploadAll} disabled={!pendingCount}>
              {uploading ? "Uploading…" : `Upload ${pendingCount} file${pendingCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
