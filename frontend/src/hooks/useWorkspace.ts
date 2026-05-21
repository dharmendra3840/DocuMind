"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAppStore } from "@/store/appStore";

export function useWorkspaces() {
  const setWorkspaces = useAppStore((s) => s.setWorkspaces);

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await apiClient.listWorkspaces();
      setWorkspaces(data.workspaces);
      return data.workspaces;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const addWorkspace = useAppStore((s) => s.addWorkspace);
  return useMutation({
    mutationFn: (name: string) => apiClient.createWorkspace(name),
    onSuccess: (workspace) => {
      addWorkspace(workspace);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  const removeWorkspace = useAppStore((s) => s.removeWorkspace);
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWorkspace(id),
    onSuccess: (_, id) => {
      removeWorkspace(id);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
