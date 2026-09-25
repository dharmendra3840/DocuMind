"use client";
import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onStop, disabled, isStreaming, placeholder = "Ask about your documents…" }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasText, setHasText] = useState(false);
  const [modKey, setModKey] = useState("Ctrl");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("⌘");
  }, []);

  const resize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const clear = () => {
    if (textareaRef.current) textareaRef.current.value = "";
    setHasText(false);
    resize();
  };

  const submit = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled || isStreaming) return;
    onSend(value);
    clear();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      clear();
    }
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-paper via-paper to-paper/0 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-rule bg-white p-2 shadow-[0_8px_30px_-12px_rgba(22,24,29,0.18)] transition-colors focus-within:border-ink/40">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onInput={() => { resize(); setHasText(!!textareaRef.current?.value.trim()); }}
            disabled={disabled && !isStreaming}
            aria-label="Message"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isStreaming ? (
            <button onClick={onStop} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2" aria-label="Stop generating">
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button onClick={submit} disabled={disabled || !hasText}
              className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
                disabled || !hasText ? "cursor-not-allowed bg-paper-deep text-ink-muted" : "bg-ink text-paper hover:bg-ink-soft")}
              aria-label="Send message">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 hidden text-center text-xs text-ink-muted sm:block">
          Enter to send · Shift+Enter for a new line · {modKey}+K to clear
        </p>
      </div>
    </div>
  );
}
