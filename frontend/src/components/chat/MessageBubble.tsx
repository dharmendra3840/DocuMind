"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, ThumbsDown, Copy, Trash2, Check, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source } from "@/types/api";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageBubbleProps {
  message: ChatMessage;
  onFeedback?: (id: string, rating: "up" | "down") => void;
  onSourceClick?: (source: Source) => void;
  onDelete?: (id: string) => void;
}

const actionButton = "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable (e.g. insecure context) */ }
  };
  return (
    <button onClick={copy} className={actionButton} aria-label={copied ? "Copied" : "Copy message"}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs text-redline">
        Delete?
        <button onClick={onConfirm} className="rounded px-1.5 py-0.5 font-medium hover:bg-red-100">Yes</button>
        <button onClick={() => setConfirming(false)} className="rounded px-1.5 py-0.5 text-ink-muted hover:bg-paper-deep">No</button>
      </span>
    );
  }
  return (
    <button onClick={() => setConfirming(true)} className={cn(actionButton, "hover:text-redline")} aria-label="Delete message">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function MessageBubble({ message, onFeedback, onSourceClick, onDelete }: MessageBubbleProps) {
  const { id, role, content, sources, feedback, isStreaming, error, stopped, interrupted } = message;

  if (role === "user") {
    return (
      <div className="group flex flex-col items-end gap-1">
        <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-paper-deep px-4 py-2.5 text-[15px] leading-relaxed text-ink [overflow-wrap:anywhere] sm:max-w-[75%]">
          {content}
        </div>
        <div className="flex items-center gap-0.5 md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100">
          <CopyButton text={content} />
          {onDelete && <DeleteButton onConfirm={() => onDelete(id)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink font-serif text-[15px] font-semibold text-paper" aria-hidden="true">D</span>
      <div className="min-w-0 flex-1">
        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-redline" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {content}
          </p>
        ) : isStreaming && !content ? (
          <div className="flex h-7 items-center gap-1" aria-label="Thinking">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:300ms]" />
          </div>
        ) : (
          <div className={cn(
            "prose prose-stone max-w-none text-[15px] leading-relaxed text-ink-soft [overflow-wrap:anywhere]",
            "prose-headings:font-serif prose-headings:font-normal prose-headings:text-ink prose-strong:text-ink prose-a:text-ink",
            "prose-code:rounded prose-code:bg-paper-deep prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-ink prose-code:before:content-none prose-code:after:content-none",
            "prose-pre:border prose-pre:border-rule prose-pre:bg-paper-deep prose-pre:text-ink",
            isStreaming && "[&>*:last-child]:after:ml-0.5 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-4 [&>*:last-child]:after:w-0.5 [&>*:last-child]:after:animate-pulse [&>*:last-child]:after:bg-ink [&>*:last-child]:after:align-middle [&>*:last-child]:after:content-['']"
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}

        {stopped && <p className="mt-1 text-xs italic text-ink-muted">Stopped — this partial answer wasn’t saved.</p>}
        {interrupted && <p className="mt-1 text-xs italic text-redline">The connection dropped before the answer finished, so it wasn’t saved. Try asking again.</p>}

        {/* Citations */}
        {sources && sources.length > 0 && !error && (
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Sources">
            {sources.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => onSourceClick?.(s)}
                  className="flex max-w-[260px] items-center gap-1.5 rounded-md border border-rule bg-white px-2 py-1 font-mono text-[11.5px] text-ink-muted transition-colors hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  title={`${s.filename} · page ${s.page}`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-redline/10 text-[10px] font-medium text-redline">{i + 1}</span>
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{s.filename}</span>
                  <span className="shrink-0">· p.{s.page}</span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {!isStreaming && !error && (
          <div className="mt-2 flex flex-wrap items-center gap-0.5">
            <CopyButton text={content} />
            {onFeedback && (
              <>
                <button onClick={() => onFeedback(id, "up")} aria-label="Helpful" aria-pressed={feedback === "up"}
                  className={cn(actionButton, feedback === "up" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700")}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onFeedback(id, "down")} aria-label="Not helpful" aria-pressed={feedback === "down"}
                  className={cn(actionButton, feedback === "down" && "bg-red-50 text-redline hover:bg-red-50 hover:text-redline")}>
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {onDelete && <DeleteButton onConfirm={() => onDelete(id)} />}
          </div>
        )}
      </div>
    </div>
  );
}
