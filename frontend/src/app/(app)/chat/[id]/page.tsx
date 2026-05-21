"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { MessageInput } from "@/components/chat/MessageInput";
import { SourcesPanel } from "@/components/chat/SourcesPanel";
import { TopBar } from "@/components/layout/TopBar";
import { useAppStore } from "@/store/appStore";
import type { Source } from "@/types/api";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [sentInitial, setSentInitial] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const { data: docsData } = useDocuments(activeWorkspaceId);
  const readyDocs = docsData?.documents.filter((d) => d.status === "READY") ?? [];

  const { messages, isStreaming, historyLoading, sendMessage, stopStreaming, submitFeedback, deleteMessage } = useChat(id);

  useEffect(() => {
    if (initialQuery && !sentInitial && !historyLoading) {
      setSentInitial(true);
      sendMessage(initialQuery, selectedDocIds.length ? selectedDocIds : undefined);
    }
  }, [initialQuery, sentInitial, historyLoading, sendMessage, selectedDocIds]);

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const handleSend = (text: string) => {
    sendMessage(text, selectedDocIds.length ? selectedDocIds : undefined);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0">
          {/* Document filter bar — only shown when there are ready docs */}
          {readyDocs.length > 0 && (
            <div className="px-4 py-2 border-b border-border bg-bg-secondary flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted shrink-0">Scope:</span>
              {readyDocs.map((doc) => {
                const active = selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      active
                        ? "bg-accent text-white"
                        : "bg-bg-surface border border-border text-text-secondary hover:border-accent hover:text-accent"
                    )}
                    title={doc.filename}
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="max-w-[140px] truncate">{doc.filename}</span>
                    {active && <X className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
              {selectedDocIds.length > 0 ? (
                <button
                  onClick={() => setSelectedDocIds([])}
                  className="text-xs text-text-muted hover:text-text-primary ml-1"
                >
                  Clear
                </button>
              ) : (
                <span className="text-xs text-text-muted italic">All documents</span>
              )}
            </div>
          )}

          <ChatFeed
            messages={messages}
            isLoading={historyLoading}
            onFeedback={submitFeedback}
            onSourceClick={setSelectedSource}
            onDelete={deleteMessage}
          />
          <MessageInput onSend={handleSend} onStop={stopStreaming} isStreaming={isStreaming} disabled={historyLoading} />
        </div>
        <SourcesPanel source={selectedSource} onClose={() => setSelectedSource(null)} />
      </div>
    </div>
  );
}
