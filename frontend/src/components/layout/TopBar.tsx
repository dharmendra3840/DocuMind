"use client";
import { Menu } from "lucide-react";
import { useAppStore } from "@/store/appStore";

interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  const { activeWorkspaceId, workspaces, setMobileNavOpen } = useAppStore();
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-paper/85 px-4 backdrop-blur-md">
      <button
        onClick={() => setMobileNavOpen(true)}
        className="-ml-1 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate text-ink-muted">{workspace?.name}</span>
        {title && (
          <>
            <span className="text-ink-muted/50" aria-hidden="true">/</span>
            <span className="truncate font-medium text-ink" aria-current="page">{title}</span>
          </>
        )}
      </nav>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
