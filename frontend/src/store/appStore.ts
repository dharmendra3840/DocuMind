import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Workspace } from "@/types/api";
import { apiClient } from "@/lib/api";

interface AppState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  sidebarOpen: boolean;
  hydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  toggleSidebar: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeWorkspaceId: null,
      workspaces: [],
      sidebarOpen: true,
      hydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        apiClient.setAccessToken(accessToken);
        set({ user, accessToken, refreshToken });
      },

      clearAuth: () => {
        apiClient.clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, activeWorkspaceId: null, workspaces: [] });
      },

      setWorkspaces: (workspaces) => {
        const current = get().activeWorkspaceId;
        const validCurrent = workspaces.find((w) => w.id === current);
        set({
          workspaces,
          activeWorkspaceId: validCurrent ? current : workspaces[0]?.id ?? null,
        });
      },

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      addWorkspace: (workspace) =>
        set((s) => ({ workspaces: [...s.workspaces, workspace], activeWorkspaceId: workspace.id })),

      updateWorkspace: (workspace) =>
        set((s) => ({ workspaces: s.workspaces.map((w) => (w.id === workspace.id ? workspace : w)) })),

      removeWorkspace: (id) =>
        set((s) => {
          const remaining = s.workspaces.filter((w) => w.id !== id);
          return { workspaces: remaining, activeWorkspaceId: remaining[0]?.id ?? null };
        }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "documind-store",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        activeWorkspaceId: s.activeWorkspaceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          apiClient.setAccessToken(state.accessToken);
        }
        state?.setHydrated(true);
      },
      },
    }
  )
);
