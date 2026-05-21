"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FileText, MessageSquare, Plus, Trash2, ChevronDown, LogOut, PanelLeftClose, PanelLeft, Pencil, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toastSuccess, toastError } from "@/components/ui/Toaster";
import { groupByDate } from "@/lib/utils";
import type { Conversation } from "@/types/api";

function ConvMenu({ conv, onDelete, onRename }: { conv: Conversation; onDelete: () => void; onRename: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        title="Options"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-32 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onRename(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Rename
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeWorkspaceId, workspaces, setActiveWorkspace, clearAuth, sidebarOpen, toggleSidebar } = useAppStore();
  useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const qc = useQueryClient();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations", activeWorkspaceId],
    queryFn: () => apiClient.listConversations(activeWorkspaceId!),
    enabled: !!activeWorkspaceId,
    refetchInterval: 5000,
  });

  const grouped = conversationsData?.conversations
    ? groupByDate(conversationsData.conversations as Conversation[])
    : {};

  const handleDeleteConversation = async (convId: string) => {
    try {
      await apiClient.deleteConversation(convId);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (pathname === `/chat/${convId}`) router.push("/chat");
      toastSuccess("Conversation deleted");
    } catch {
      toastError("Failed to delete conversation");
    }
  };

  const handleRenameConversation = async (convId: string) => {
    if (!renameValue.trim()) return;
    try {
      await apiClient.renameConversation(convId, renameValue.trim());
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setRenamingConvId(null);
      toastSuccess("Renamed");
    } catch {
      toastError("Failed to rename");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace.mutateAsync(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setShowNewWorkspace(false);
      toastSuccess("Workspace created");
    } catch {
      toastError("Failed to create workspace");
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token") ?? "";
    await apiClient.logout(refreshToken);
    clearAuth();
    router.push("/login");
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 w-12 bg-slate-900 border-r border-slate-700">
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-200 p-2">
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold text-sm text-white">DocuMind</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-200 p-1">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 py-2 border-b border-slate-700">
        <button
          onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 text-sm text-slate-200"
        >
          <span className="truncate">{activeWorkspace?.name ?? "Select workspace"}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 transition-transform shrink-0", workspaceMenuOpen && "rotate-180")} />
        </button>
        {workspaceMenuOpen && (
          <div className="mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => { setActiveWorkspace(w.id); setWorkspaceMenuOpen(false); }}
                className={cn("w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors", w.id === activeWorkspaceId ? "text-indigo-400" : "text-slate-300")}
              >
                {w.name}
              </button>
            ))}
            <button
              onClick={() => { setShowNewWorkspace(true); setWorkspaceMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New workspace
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 py-2 border-b border-slate-700 space-y-0.5">
        <Link
          href="/documents"
          className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors", pathname.startsWith("/documents") ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
        >
          <FileText className="w-4 h-4" /> Documents
        </Link>
        <Link
          href="/chat"
          className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors", pathname === "/chat" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
        >
          <MessageSquare className="w-4 h-4" /> New Chat
        </Link>
      </nav>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {Object.entries(grouped).map(([dateLabel, convs]) => (
          <div key={dateLabel} className="mb-3">
            <p className="text-xs text-slate-500 px-2 mb-1 uppercase tracking-wide">{dateLabel}</p>
            {convs.map((conv) => (
              <div key={conv.id} className="mb-0.5">
                {renamingConvId === conv.id ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameConversation(conv.id);
                        if (e.key === "Escape") setRenamingConvId(null);
                      }}
                      className="flex-1 text-xs bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white outline-none"
                    />
                    <button onClick={() => handleRenameConversation(conv.id)} className="text-xs text-indigo-400 hover:text-white px-1 shrink-0">✓</button>
                    <button onClick={() => setRenamingConvId(null)} className="text-xs text-slate-500 hover:text-white px-1 shrink-0">✕</button>
                  </div>
                ) : (
                  <div className={cn("flex items-center gap-1 rounded transition-colors", pathname === `/chat/${conv.id}` ? "bg-indigo-500/20" : "hover:bg-slate-800")}>
                    <Link
                      href={`/chat/${conv.id}`}
                      className={cn("flex items-center gap-2 px-2 py-1.5 text-sm flex-1 min-w-0 rounded", pathname === `/chat/${conv.id}` ? "text-indigo-400" : "text-slate-400 hover:text-slate-200")}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{conv.title ?? "Untitled chat"}</span>
                    </Link>
                    <ConvMenu
                      conv={conv}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      onRename={() => { setRenamingConvId(conv.id); setRenameValue(conv.title ?? ""); }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white uppercase shrink-0">
            {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{user?.name ?? user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Modal open={showNewWorkspace} onClose={() => setShowNewWorkspace(false)} title="New Workspace">
        <div className="flex flex-col gap-4">
          <Input
            label="Workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="e.g. Legal Q1, Thesis Research"
            onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowNewWorkspace(false)}>Cancel</Button>
            <Button size="sm" loading={createWorkspace.isPending} onClick={handleCreateWorkspace}>Create</Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
