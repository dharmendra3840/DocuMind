"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { TopBar } from "@/components/layout/TopBar";
import { MessageInput } from "@/components/chat/MessageInput";
import { toastError } from "@/components/ui/Toaster";

const SUGGESTIONS = [
  "Summarise the key points across my documents",
  "What obligations, risks, or deadlines are mentioned?",
  "Which document covers pricing or fees, and what does it say?",
];

export default function NewChatPage() {
  const router = useRouter();
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const { data: docsData, isLoading: docsLoading } = useDocuments(activeWorkspaceId);
  const [creating, setCreating] = useState(false);
  const readyCount = docsData?.documents.filter((d) => d.status === "READY").length ?? 0;
  const noDocuments = !docsLoading && (docsData?.total ?? 0) === 0;

  const handleSend = async (message: string) => {
    if (!activeWorkspaceId) { toastError("Select a workspace first"); return; }
    setCreating(true);
    try {
      const conv = await apiClient.createConversation(activeWorkspaceId, "New Conversation");
      router.push(`/chat/${conv.id}?q=${encodeURIComponent(message)}`);
    } catch (err) {
      toastError(getErrorMessage(err, "Couldn't start a conversation"));
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar title="New chat" />
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-tight tracking-[-0.02em] text-ink">What do you want to know?</h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {readyCount > 0
              ? `Ask across ${readyCount} document${readyCount === 1 ? "" : "s"} in this workspace. Every answer cites its sources.`
              : "Ask in plain English. Every answer cites the file and page it came from."}
          </p>

          {noDocuments ? (
            <div className="mt-8 flex flex-col gap-4 rounded-xl border border-rule bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">This workspace has no documents yet</p>
                <p className="mt-0.5 text-sm text-ink-muted">Upload a PDF, Word, or text file and DocuMind will index it for questions.</p>
              </div>
              <Link href="/documents" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
                <Upload className="h-4 w-4" /> Upload documents
              </Link>
            </div>
          ) : (
            <ul className="mt-8 grid gap-2 sm:grid-cols-3">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => handleSend(s)}
                    disabled={creating || !activeWorkspaceId}
                    className="group flex h-full w-full flex-col justify-between gap-3 rounded-xl border border-rule bg-white p-4 text-left text-sm leading-snug text-ink-soft transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    {s}
                    <ArrowRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <MessageInput onSend={handleSend} disabled={creating || !activeWorkspaceId} />
    </div>
  );
}
