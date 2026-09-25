"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { useConversations } from "@/hooks/useConversations";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { MessageInput } from "@/components/chat/MessageInput";
import { SourcesPanel } from "@/components/chat/SourcesPanel";
import { TopBar } from "@/components/layout/TopBar";
import { toastError } from "@/components/ui/Toaster";
import { useAppStore } from "@/store/appStore";
import { cn, getErrorMessage } from "@/lib/utils";
import type { Source } from "@/types/api";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const sentInitial = useRef(false);

  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const { data: docsData } = useDocuments(activeWorkspaceId);
  const { data: convData } = useConversations(activeWorkspaceId);
  const readyDocs = docsData?.documents.filter((d) => d.status === "READY") ?? [];
  const title = convData?.conversations.find((c) => c.id === id)?.title || "Conversation";

  const { messages, isStreaming, historyLoading, sendMessage, stopStreaming, submitFeedback, deleteMessage } = useChat(id);

  // The first question arrives as ?q= from the new-chat page. Send it once, then
  // drop it from the URL so reloading the page doesn't ask it again.
  useEffect(() => {
    if (!initialQuery || sentInitial.current || historyLoading) return;
    sentInitial.current = true;
    router.replace(`/chat/${id}`, { scroll: false });
    if (messages.length === 0) sendMessage(initialQuery);
  }, [initialQuery, historyLoading, messages.length, sendMessage, router, id]);

  const toggleDoc = (docId: string) =>
    setSelectedDocIds((prev) => (prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]));

  const handleDelete = useCallback(async (msgId: string) => {
    try { await deleteMessage(msgId); } catch (err) { toastError(getErrorMessage(err, "Couldn't delete the message")); }
  }, [deleteMessage]);

  const handleFeedback = useCallback(async (msgId: string, rating: "up" | "down") => {
    try { await submitFeedback(msgId, rating); } catch (err) { toastError(getErrorMessage(err, "Couldn't save your feedback")); }
  }, [submitFeedback]);

  const closeSource = useCallback(() => setSelectedSource(null), []);

  return (
    <div className="flex h-full flex-col">
      <TopBar title={title} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {readyDocs.length > 0 && (
            <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-rule px-4 py-2" role="group" aria-label="Limit answers to documents">
              <span className="shrink-0 text-xs text-ink-muted">Scope</span>
              {readyDocs.map((doc) => {
                const active = selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    aria-pressed={active}
                    title={doc.filename}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
                      active ? "border-ink bg-ink text-paper" : "border-rule bg-white text-ink-soft hover:border-ink/40"
                    )}
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="max-w-[160px] truncate">{doc.filename}</span>
                    {active && <X className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
              {selectedDocIds.length > 0 ? (
                <button onClick={() => setSelectedDocIds([])} className="ml-1 shrink-0 text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">Clear</button>
              ) : (
                <span className="shrink-0 text-xs italic text-ink-muted">All documents</span>
              )}
            </div>
          )}
          <ChatFeed
            messages={messages}
            isLoading={historyLoading}
            onFeedback={handleFeedback}
            onSourceClick={setSelectedSource}
            onDelete={handleDelete}
          />
          <MessageInput
            onSend={(text) => sendMessage(text, selectedDocIds.length ? selectedDocIds : undefined)}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            disabled={historyLoading}
            placeholder="Ask a follow-up…"
          />
        </div>
        <SourcesPanel source={selectedSource} onClose={closeSource} />
      </div>
    </div>
  );
}
