"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Message, Source, SSEEvent } from "@/types/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
  /** The answer failed; `content` holds the error to show. */
  error?: boolean;
  /** The user stopped generation; the partial answer isn't saved. */
  stopped?: boolean;
  /** The connection dropped mid-answer; the partial answer isn't saved. */
  interrupted?: boolean;
}

async function describeHttpError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch { /* not JSON */ }
  if (response.status === 429) return "Too many questions at once. Please wait a moment and try again.";
  return `The server couldn't answer (error ${response.status}). Please try again.`;
}

export function useChat(convId: string | null) {
  const qc = useQueryClient();
  // Messages not yet in the fetched history: the question being asked and its
  // streaming answer (or a failed/stopped answer, which the server never saved).
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Switching conversations (or leaving the page) cancels any in-flight answer.
  useEffect(() => {
    setPending([]);
    return () => abortRef.current?.abort();
  }, [convId]);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiClient.getMessages(convId!),
    enabled: !!convId,
  });

  const history: ChatMessage[] = historyData?.messages.map((m: Message) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    sources: m.sources ?? undefined,
    feedback: m.feedback,
  })) ?? [];
  const allMessages = [...history, ...pending];

  const updateLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setPending((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });

  const sendMessage = useCallback(
    async (text: string, docIds?: string[], includeSources = true) => {
      if (!convId || abortRef.current) return;

      const stamp = Date.now();
      setPending([
        { id: `local-${stamp}`, role: "user", content: text },
        { id: `streaming-${stamp}`, role: "assistant", content: "", isStreaming: true },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let failed = false;
      let stopped = false;

      const handleLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        let event: SSEEvent;
        try { event = JSON.parse(line.slice(6)); } catch { return; }
        if (event.type === "token") {
          updateLast((m) => ({ ...m, content: m.content + event.content }));
        } else if (event.type === "sources") {
          updateLast((m) => ({ ...m, sources: event.sources }));
        } else if (event.type === "error") {
          failed = true;
          updateLast((m) => ({ ...m, content: m.content || event.message || "Something went wrong.", error: !m.content, isStreaming: false }));
        } else if (event.type === "message_saved") {
          updateLast((m) => ({ ...m, id: event.message_id, isStreaming: false }));
        }
      };

      try {
        const send = (authorization: string) =>
          fetch(apiClient.getQueryUrl(convId), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authorization },
            body: JSON.stringify({ message: text, include_sources: includeSources, doc_ids: docIds?.length ? docIds : null }),
            signal: controller.signal,
          });

        // fetch bypasses the axios refresh interceptor, and access tokens only
        // last 15 minutes — refresh once and retry instead of failing.
        let response = await send(apiClient.getAuthHeader());
        if (response.status === 401) {
          response = await send(`Bearer ${await apiClient.refreshAccessToken()}`);
        }
        if (!response.ok || !response.body) throw new Error(await describeHttpError(response));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        // A network chunk can end mid-line; keep the tail until the rest arrives.
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handleLine);
        }
        buffer += decoder.decode();
        if (buffer) handleLine(buffer);
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") {
          stopped = true;
          updateLast((m) => ({ ...m, isStreaming: false, stopped: true }));
        } else {
          failed = true;
          // fetch reports dropped connections as a bare TypeError ("network error").
          const message = err instanceof TypeError || !(err instanceof Error) || !err.message
            ? "Couldn't reach DocuMind. Check your connection and try again."
            : err.message;
          updateLast((m) => (m.content
            ? { ...m, isStreaming: false, interrupted: true }
            : { ...m, content: message, error: true, isStreaming: false }));
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
        qc.invalidateQueries({ queryKey: ["conversations"] });
        // Wait for the saved history before dropping the local copies, so the
        // answer doesn't blink out and back in.
        await qc.invalidateQueries({ queryKey: ["messages", convId] });
        // The server saved the question either way; keep only an unsaved answer.
        setPending((prev) => (failed || stopped ? prev.filter((m) => m.role === "assistant") : []));
      }
    },
    [convId, qc]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const deleteMessage = useCallback(
    async (msgId: string) => {
      if (!convId) return;
      await apiClient.deleteMessage(convId, msgId);
      qc.invalidateQueries({ queryKey: ["messages", convId] });
    },
    [convId, qc]
  );

  const submitFeedback = useCallback(
    async (msgId: string, rating: "up" | "down") => {
      if (!convId) return;
      await apiClient.submitFeedback(convId, msgId, rating);
      qc.invalidateQueries({ queryKey: ["messages", convId] });
    },
    [convId, qc]
  );

  return { messages: allMessages, isStreaming, historyLoading, sendMessage, stopStreaming, submitFeedback, deleteMessage };
}
