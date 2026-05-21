"use client";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Source } from "@/types/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
}

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onFeedback: (id: string, rating: "up" | "down") => void;
  onSourceClick: (source: Source) => void;
  onDelete?: (id: string) => void;
}

export function ChatFeed({ messages, isLoading, onFeedback, onSourceClick, onDelete }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-text-muted">Loading conversation...</div>;
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-accent text-xl">D</span>
        </div>
        <div>
          <p className="font-medium text-text-primary">Ask anything about your documents</p>
          <p className="text-sm text-text-muted mt-1">Upload documents first, then start asking questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            id={msg.id}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
            feedback={msg.feedback}
            isStreaming={msg.isStreaming}
            onFeedback={msg.role === "assistant" && !msg.isStreaming ? onFeedback : undefined}
            onSourceClick={onSourceClick}
            onDelete={!msg.isStreaming && !msg.id.startsWith("local-") && !msg.id.startsWith("streaming-") ? onDelete : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
