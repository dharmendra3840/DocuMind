"use client";
import { useRef, useEffect, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function MessageInput({ onSend, onStop, disabled, isStreaming }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (textareaRef.current) textareaRef.current.value = "";
    }
  };

  const submit = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled || isStreaming) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="border-t border-border bg-bg-secondary p-4">
      <div className="flex gap-3 items-end max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask a question about your documents..."
          onKeyDown={handleKeyDown}
          disabled={disabled && !isStreaming}
          className={cn(
            "flex-1 bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary resize-none",
            "placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] max-h-[120px]"
          )}
        />
        {isStreaming ? (
          <button onClick={onStop} className="p-2.5 rounded-lg bg-accent-red hover:bg-red-400 text-white transition-colors shrink-0" title="Stop generation">
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={disabled} className="p-2.5 rounded-lg bg-accent hover:bg-indigo-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-text-muted text-center mt-2">Enter to send · Shift+Enter for newline · ⌘K to clear</p>
    </div>
  );
}
