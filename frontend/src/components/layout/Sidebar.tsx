"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  FileText, MessageSquare, Plus, ChevronDown, LogOut, PanelLeftClose, PanelLeft,
  Pencil, Trash2, MoreHorizontal, X, Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, getErrorMessage, groupByDate } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { useWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/useWorkspace";
import { useConversations } from "@/hooks/useConversations";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { toastSuccess, toastError } from "@/components/ui/Toaster";
import type { Conversation } from "@/types/api";

type Dialog =
  | { kind: "new-workspace" }
  | { kind: "rename-workspace"; id: string; name: string }
  | { kind: "delete-workspace"; id: string; name: string }
  | { kind: "delete-conversation"; conv: Conversation };

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, close]);
  return ref;
}

function ConvMenu({ onDelete, onRename }: { onDelete: () => void; onRename: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label="Conversation options"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 overflow-hidden rounded-lg border border-rule bg-white py-1 shadow-elevated" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); onRename(); }} className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-soft hover:bg-paper">
            <Pencil className="h-3.5 w-3.5" /> Rename
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-redline hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const {
    user, activeWorkspaceId, workspaces, setActiveWorkspace, clearAuth,
    sidebarOpen, toggleSidebar, mobileNavOpen, setMobileNavOpen,
  } = useAppStore();
  useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const { data: conversationsData } = useConversations(activeWorkspaceId);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useDismiss(workspaceMenuOpen, () => setWorkspaceMenuOpen(false));
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileNavOpen(false); }, [pathname, setMobileNavOpen]);

  const grouped = conversationsData?.conversations ? groupByDate(conversationsData.conversations) : {};
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const closeDialog = () => { setDialog(null); setNameValue(""); };

  const switchWorkspace = (id: string) => {
    setActiveWorkspace(id);
    setWorkspaceMenuOpen(false);
    // A conversation belongs to one workspace; don't leave it open under another.
    if (pathname.startsWith("/chat/")) router.push("/chat");
  };

  const submitWorkspaceName = async () => {
    const name = nameValue.trim();
    if (!name || !dialog) return;
    try {
      if (dialog.kind === "new-workspace") {
        await createWorkspace.mutateAsync(name);
        toastSuccess("Workspace created");
        if (pathname.startsWith("/chat/")) router.push("/chat");
      } else if (dialog.kind === "rename-workspace") {
        await updateWorkspace.mutateAsync({ id: dialog.id, name });
        toastSuccess("Workspace renamed");
      }
      closeDialog();
    } catch (err) {
      toastError(getErrorMessage(err, "Couldn't save the workspace"));
    }
  };

  const confirmDelete = async () => {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.kind === "delete-workspace") {
        await deleteWorkspace.mutateAsync(dialog.id);
        toastSuccess(`Deleted “${dialog.name}”`);
        if (pathname.startsWith("/chat/")) router.push("/chat");
      } else if (dialog.kind === "delete-conversation") {
        await apiClient.deleteConversation(dialog.conv.id);
        qc.invalidateQueries({ queryKey: ["conversations"] });
        if (pathname === `/chat/${dialog.conv.id}`) router.push("/chat");
        toastSuccess("Conversation deleted");
      }
      closeDialog();
    } catch (err) {
      toastError(getErrorMessage(err, "Couldn't delete it. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const renameConversation = async (convId: string) => {
    const title = renameValue.trim();
    if (!title) return;
    try {
      await apiClient.renameConversation(convId, title);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setRenamingConvId(null);
    } catch (err) {
      toastError(getErrorMessage(err, "Couldn't rename the conversation"));
    }
  };

  const handleLogout = async () => {
    const { refreshToken } = useAppStore.getState();
    try {
      if (refreshToken) await apiClient.logout(refreshToken);
    } catch {
      // Revoking the token server-side is best effort; always sign out locally.
    } finally {
      clearAuth();
      qc.clear();
      router.replace("/");
    }
  };

  const navItem = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
      active ? "bg-white font-medium text-ink shadow-sm ring-1 ring-rule" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
    );

  const panel = (
    <>
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Link href="/chat" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink" aria-label="DocuMind — new chat">
          <Logo />
        </Link>
        <button onClick={toggleSidebar} className="hidden rounded-md p-1.5 text-ink-muted hover:bg-paper-deep hover:text-ink md:block" aria-label="Collapse sidebar">
          <PanelLeftClose className="h-4 w-4" />
        </button>
        <button onClick={() => setMobileNavOpen(false)} className="rounded-md p-1.5 text-ink-muted hover:bg-paper-deep hover:text-ink md:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace switcher */}
      <div ref={workspaceMenuRef} className="relative px-3 pb-2">
        <button
          onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-rule bg-white px-3 py-2 text-left text-[13.5px] text-ink transition-colors hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          aria-expanded={workspaceMenuOpen}
          aria-haspopup="menu"
        >
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-ink-muted">Workspace</span>
            <span className="block truncate font-medium">{activeWorkspace?.name ?? "Select workspace"}</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform", workspaceMenuOpen && "rotate-180")} />
        </button>
        {workspaceMenuOpen && (
          <div className="absolute inset-x-3 top-full z-50 mt-1 overflow-hidden rounded-lg border border-rule bg-white py-1 shadow-elevated" role="menu">
            <div className="max-h-56 overflow-y-auto">
              {workspaces.map((w) => (
                <button key={w.id} role="menuitem" onClick={() => switchWorkspace(w.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13.5px] text-ink-soft hover:bg-paper">
                  <span className="truncate">{w.name}</span>
                  {w.id === activeWorkspaceId && <Check className="h-3.5 w-3.5 shrink-0 text-ink" />}
                </button>
              ))}
            </div>
            <div className="my-1 border-t border-rule" />
            <button role="menuitem" onClick={() => { setWorkspaceMenuOpen(false); setNameValue(""); setDialog({ kind: "new-workspace" }); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13.5px] text-ink-soft hover:bg-paper">
              <Plus className="h-3.5 w-3.5" /> New workspace
            </button>
            {activeWorkspace && (
              <>
                <button role="menuitem" onClick={() => { setWorkspaceMenuOpen(false); setNameValue(activeWorkspace.name); setDialog({ kind: "rename-workspace", id: activeWorkspace.id, name: activeWorkspace.name }); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13.5px] text-ink-soft hover:bg-paper">
                  <Pencil className="h-3.5 w-3.5" /> Rename workspace
                </button>
                <button role="menuitem" disabled={workspaces.length < 2}
                  title={workspaces.length < 2 ? "You need at least one workspace" : undefined}
                  onClick={() => { setWorkspaceMenuOpen(false); setDialog({ kind: "delete-workspace", id: activeWorkspace.id, name: activeWorkspace.name }); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13.5px] text-redline hover:bg-red-50 disabled:cursor-not-allowed disabled:text-ink-muted/60 disabled:hover:bg-transparent">
                  <Trash2 className="h-3.5 w-3.5" /> Delete workspace
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="space-y-0.5 px-3 pb-3" aria-label="Main">
        <Link href="/chat" className={navItem(pathname === "/chat")}>
          <Plus className="h-4 w-4" /> New chat
        </Link>
        <Link href="/documents" className={navItem(pathname.startsWith("/documents"))}>
          <FileText className="h-4 w-4" /> Documents
        </Link>
      </nav>

      {/* Conversation history */}
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-rule px-3 py-3">
        {Object.keys(grouped).length === 0 && (
          <p className="px-2.5 py-2 text-[13px] leading-relaxed text-ink-muted">Your conversations will appear here.</p>
        )}
        {Object.entries(grouped).map(([dateLabel, convs]) => (
          <div key={dateLabel} className="mb-4">
            <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{dateLabel}</p>
            {convs.map((conv) => {
              const active = pathname === `/chat/${conv.id}`;
              if (renamingConvId === conv.id) {
                return (
                  <div key={conv.id} className="flex items-center gap-1 px-1 py-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameConversation(conv.id);
                        if (e.key === "Escape") setRenamingConvId(null);
                      }}
                      aria-label="Conversation title"
                      className="min-w-0 flex-1 rounded-md border border-ink bg-white px-2 py-1 text-[13px] text-ink outline-none"
                    />
                    <button onClick={() => renameConversation(conv.id)} className="rounded p-1 text-ink hover:bg-paper-deep" aria-label="Save title"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setRenamingConvId(null)} className="rounded p-1 text-ink-muted hover:bg-paper-deep" aria-label="Cancel rename"><X className="h-3.5 w-3.5" /></button>
                  </div>
                );
              }
              return (
                <div key={conv.id} className={cn("group flex items-center gap-1 rounded-lg pr-1 transition-colors", active ? "bg-white shadow-sm ring-1 ring-rule" : "hover:bg-paper-deep")}>
                  <Link
                    href={`/chat/${conv.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink", active ? "font-medium text-ink" : "text-ink-soft")}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    <span className="truncate">{conv.title || "Untitled chat"}</span>
                  </Link>
                  {/* Always visible on touch screens; revealed on hover/focus with a mouse. */}
                  <div className={cn("md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100", active && "md:opacity-100")}>
                    <ConvMenu
                      onDelete={() => setDialog({ kind: "delete-conversation", conv })}
                      onRename={() => { setRenamingConvId(conv.id); setRenameValue(conv.title ?? ""); }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-rule px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium uppercase text-paper" aria-hidden="true">
          {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{user?.name || user?.email}</p>
          {user?.name && <p className="truncate text-[12px] text-ink-muted">{user.email}</p>}
        </div>
        <button onClick={handleLogout} className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper-deep hover:text-redline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink" title="Sign out" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileNavOpen && <div className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />}

      {/* Desktop collapsed rail */}
      {!sidebarOpen && (
        <div className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-rule bg-paper-deep/40 py-3 md:flex">
          <button onClick={toggleSidebar} className="rounded-md p-2 text-ink-muted hover:bg-paper-deep hover:text-ink" aria-label="Expand sidebar">
            <PanelLeft className="h-4 w-4" />
          </button>
          <Link href="/chat" className="rounded-md p-2 text-ink-muted hover:bg-paper-deep hover:text-ink" aria-label="New chat"><Plus className="h-4 w-4" /></Link>
          <Link href="/documents" className="rounded-md p-2 text-ink-muted hover:bg-paper-deep hover:text-ink" aria-label="Documents"><FileText className="h-4 w-4" /></Link>
        </div>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-rule bg-paper transition-transform duration-200",
          "md:static md:z-auto md:w-64 md:translate-x-0 md:bg-paper-deep/40 md:transition-none",
          mobileNavOpen ? "translate-x-0 shadow-elevated" : "-translate-x-full",
          !sidebarOpen && "md:hidden"
        )}
        aria-label="Sidebar"
      >
        {panel}
      </aside>

      {/* Dialogs */}
      <Modal
        open={dialog?.kind === "new-workspace" || dialog?.kind === "rename-workspace"}
        onClose={closeDialog}
        title={dialog?.kind === "rename-workspace" ? "Rename workspace" : "New workspace"}
      >
        <form onSubmit={(e) => { e.preventDefault(); submitWorkspaceName(); }} className="flex flex-col gap-4">
          {dialog?.kind === "new-workspace" && (
            <p className="text-sm text-ink-muted">Workspaces keep documents and conversations separate — one per client, course, or project.</p>
          )}
          <Input label="Name" value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="e.g. Legal Q1, Thesis research" maxLength={100} autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={closeDialog}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!nameValue.trim()} loading={createWorkspace.isPending || updateWorkspace.isPending}>
              {dialog?.kind === "rename-workspace" ? "Save" : "Create workspace"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === "delete-workspace" || dialog?.kind === "delete-conversation"}
        onClose={closeDialog}
        title={dialog?.kind === "delete-workspace" ? "Delete workspace?" : "Delete conversation?"}
      >
        <p className="mb-5 text-sm leading-relaxed text-ink-muted">
          {dialog?.kind === "delete-workspace" ? (
            <>“<span className="font-medium text-ink">{dialog.name}</span>” and all of its documents and conversations will be permanently deleted.</>
          ) : dialog?.kind === "delete-conversation" ? (
            <>“<span className="font-medium text-ink">{dialog.conv.title || "Untitled chat"}</span>” and its messages will be permanently deleted.</>
          ) : null}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={closeDialog}>Cancel</Button>
          <Button variant="danger" size="sm" loading={busy} onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
