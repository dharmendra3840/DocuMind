"use client";
import { useAppStore } from "@/store/appStore";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { activeWorkspaceId, workspaces } = useAppStore();
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <header className="h-12 border-b border-border flex items-center px-4 gap-3 bg-bg-secondary/50 backdrop-blur-sm">
      <span className="text-sm text-text-muted">{workspace?.name}</span>
      {title && (
        <>
          <span className="text-text-muted">/</span>
          <span className="text-sm text-text-primary font-medium">{title}</span>
        </>
      )}
    </header>
  );
}
