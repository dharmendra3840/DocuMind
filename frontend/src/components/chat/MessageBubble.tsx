"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source } from "@/types/api";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  feedback?: "up" | "down" | null;
  isStreaming?: boolean;
  onFeedback?: (id: string, rating: "up" | "down") => void;
  onSourceClick?: (source: Source) => void;
  onDelete?: (id: string) => void;
}

export function MessageBubble({
  id, role, content, sources, feedback, isStreaming,
  onFeedback, onSourceClick, onDelete,
}: MessageBubbleProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className="max-w-[70%] bg-accent rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {content}
        </div>
        {!isStreaming && (
          <div className="flex items-center gap-1 pr-1">
            <button
              onClick={copyText}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex flex-col gap-1">
      <div
        className="max-w-[85%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
      >
        {isStreaming && !content ? (
          <div className="flex gap-1 items-center h-5">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:leading-relaxed [&_code]:font-mono [&_code]:text-indigo-300 [&_code]:bg-slate-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-600 [&_pre]:rounded [&_a]:text-indigo-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && content && (
          <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      {!isStreaming && (
        <div className="flex items-center gap-1 pl-1 flex-wrap">
          {/* Copy */}
          <button
            onClick={copyText}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Feedback */}
          {onFeedback && (
            <>
              <button
                onClick={() => onFeedback(id, "up")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors",
                  feedback === "up"
                    ? "text-green-400 bg-green-400/10"
                    : "text-slate-400 hover:text-green-400 hover:bg-slate-700"
                )}
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onFeedback(id, "down")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors",
                  feedback === "down"
                    ? "text-red-400 bg-red-400/10"
                    : "text-slate-400 hover:text-red-400 hover:bg-slate-700"
                )}
                title="Not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {sources.length} source{sources.length !== 1 ? "s" : ""}
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {sourcesOpen && sources && sources.length > 0 && (
        <div className="flex flex-col gap-1.5 pl-1 max-w-[85%]">
          {sources.map((s, i) => (
            <button
              key={i}
              onClick={() => onSourceClick?.(s)}
              className="text-left bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-400">{s.filename}</span>
                <span className="text-xs text-slate-500">p.{s.page}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 font-mono">{s.text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
