"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// Shared by the sidebar and the conversation page (for its title). No polling:
// useChat invalidates this query when an answer finishes streaming.
export function useConversations(workspaceId: string | null) {
  return useQuery({
    queryKey: ["conversations", workspaceId],
    queryFn: () => apiClient.listConversations(workspaceId!),
    enabled: !!workspaceId,
  });
}
