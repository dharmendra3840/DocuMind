"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, File, FileCode } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toastSuccess, toastError } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";

interface FileUploadItem {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const FILE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pdf: FileText,
  docx: File,
  txt: FileCode,
};

export function UploadZone({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newItems = accepted.map((f) => ({ file: f, progress: 0, status: "pending" as const }));
    setFiles((p) => [...p, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "text/plain": [".txt"] },
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (rej) => {
      rej.forEach((r) => toastError(`${r.file.name}: ${r.errors[0]?.message}`));
    },
  });

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (!pending.length) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      setFiles((p) => { const n = [...p]; n[i] = { ...n[i], status: "uploading" }; return n; });
      try {
        await apiClient.uploadDocument(files[i].file, workspaceId, (progress) => {
          setFiles((p) => { const n = [...p]; n[i] = { ...n[i], progress }; return n; });
        });
        setFiles((p) => { const n = [...p]; n[i] = { ...n[i], status: "done", progress: 100 }; return n; });
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Upload failed";
        setFiles((p) => { const n = [...p]; n[i] = { ...n[i], status: "error", error: msg }; return n; });
        toastError(`${files[i].file.name}: ${msg}`);
      }
    }

    qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
    toastSuccess("Documents uploaded and processing started");
    setUploading(false);
    setTimeout(() => setFiles((p) => p.filter((f) => f.status !== "done")), 1500);
  };

  const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "txt";

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
          isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-bg-surface/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragActive ? "text-accent" : "text-text-muted")} />
        <p className="text-sm font-medium text-text-primary">
          {isDragActive ? "Drop files here" : "Drag & drop files here, or click to browse"}
        </p>
        <p className="text-xs text-text-muted mt-1">PDF, DOCX, TXT · Max 50 MB per file</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((item, i) => {
            const Icon = FILE_ICONS[ext(item.file.name)] ?? File;
            return (
              <div key={i} className="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg px-4 py-3">
                <Icon className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{item.file.name}</p>
                  <p className="text-xs text-text-muted">{formatBytes(item.file.size)}</p>
                  {item.status === "uploading" && (
                    <div className="mt-1.5 h-1 bg-bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.status === "error" && <p className="text-xs text-accent-red mt-0.5">{item.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {item.status === "done" && <span className="text-xs text-accent-green">Uploaded</span>}
                  {item.status === "pending" && (
                    <button onClick={() => removeFile(i)} className="text-text-muted hover:text-accent-red">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>Clear all</Button>
            <Button size="sm" loading={uploading} onClick={uploadAll} disabled={!files.some((f) => f.status === "pending")}>
              Upload {files.filter((f) => f.status === "pending").length} file{files.filter((f) => f.status === "pending").length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
