"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { apiClient } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { MessageInput } from "@/components/chat/MessageInput";
import { toastError } from "@/components/ui/Toaster";

export default function NewChatPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAppStore();
  const [creating, setCreating] = useState(false);

  const handleSend = async (message: string) => {
    if (!activeWorkspaceId) { toastError("Select a workspace first"); return; }
    setCreating(true);
    try {
      const conv = await apiClient.createConversation(activeWorkspaceId, "New Conversation");
      router.push(`/chat/${conv.id}?q=${encodeURIComponent(message)}`);
    } catch {
      toastError("Failed to create conversation");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="New Chat" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-accent text-2xl font-bold">D</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary">Ask your documents anything</p>
          <p className="text-sm text-text-muted mt-1">Type a question below to start a new conversation</p>
        </div>
      </div>
      <MessageInput onSend={handleSend} disabled={creating || !activeWorkspaceId} />
    </div>
  );
}
