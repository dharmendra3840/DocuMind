"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export const DOCUMENT_PAGE_SIZE = 100;

export function useDocuments(workspaceId: string | null) {
  return useQuery({
    queryKey: ["documents", workspaceId],
    // One page of 100 covers typical workspaces; the list shows a note if there are more.
    queryFn: () => apiClient.listDocuments(workspaceId!, 1, DOCUMENT_PAGE_SIZE),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents ?? [];
      const hasProcessing = docs.some((d) => d.status === "PROCESSING" || d.status === "UPLOADING");
      return hasProcessing ? 2000 : false;
    },
  });
}

export function useDocumentStatus(docId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["doc-status", docId],
    queryFn: () => apiClient.getDocumentStatus(docId!),
    enabled: !!docId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PROCESSING" || status === "UPLOADING" ? 2000 : false;
    },
  });
}

export function useDeleteDocument(workspaceId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => apiClient.deleteDocument(docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", workspaceId] }),
  });
}
