"use client";
import { useLayoutEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Source } from "@/types/api";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onFeedback: (id: string, rating: "up" | "down") => void;
  onSourceClick: (source: Source) => void;
  onDelete?: (id: string) => void;
}

const isPersisted = (m: ChatMessage) => !m.isStreaming && !m.error && !m.stopped && !m.interrupted && !m.id.startsWith("local-") && !m.id.startsWith("streaming-");

export function ChatFeed({ messages, isLoading, onFeedback, onSourceClick, onDelete }: ChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Follow new output only while the reader is at (or near) the bottom, so
  // scrolling up to re-read an earlier answer isn't yanked back down.
  const pinned = useRef(true);
  const lastCount = useRef(0);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length > lastCount.current) pinned.current = true; // a new question was asked
    lastCount.current = messages.length;
    if (pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8" aria-label="Loading conversation">
          {[70, 90, 55].map((w, i) => (
            <div key={i} className={i % 2 === 0 ? "ml-auto h-10 rounded-2xl bg-paper-deep" : "h-20 rounded-lg bg-paper-deep/70"} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-serif text-2xl text-ink">Ask anything about your documents</p>
        <p className="text-sm text-ink-muted">Answers cite the file and page they came from.</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-8">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFeedback={msg.role === "assistant" && isPersisted(msg) ? onFeedback : undefined}
            onSourceClick={onSourceClick}
            onDelete={isPersisted(msg) ? onDelete : undefined}
          />
        ))}
      </div>
    </div>
  );
}
