"use client";
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Message, Source, SSEEvent } from "@/types/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
}

export function useChat(convId: string | null) {
  const qc = useQueryClient();
  const [streamingMessages, setStreamingMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => apiClient.getMessages(convId!),
    enabled: !!convId,
  });

  const allMessages: ChatMessage[] = [
    ...(historyData?.messages.map((m: Message) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources ?? undefined,
      feedback: m.feedback,
    })) ?? []),
    ...streamingMessages,
  ];

  const sendMessage = useCallback(
    async (text: string, docIds?: string[], includeSources = true) => {
      if (!convId || isStreaming) return;

      const userMsg: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text };
      const assistantMsg: ChatMessage = { id: `streaming-${Date.now()}`, role: "assistant", content: "", isStreaming: true };

      setStreamingMessages([userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(apiClient.getQueryUrl(convId), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiClient.getAuthHeader(),
          },
          body: JSON.stringify({ message: text, include_sources: includeSources, doc_ids: docIds?.length ? docIds : null }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let sources: Source[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));
              if (event.type === "token") {
                setStreamingMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) updated[updated.length - 1] = { ...last, content: last.content + event.content };
                  return updated;
                });
              } else if (event.type === "sources") {
                sources = event.sources;
                setStreamingMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) updated[updated.length - 1] = { ...last, sources };
                  return updated;
                });
              } else if (event.type === "message_saved") {
                setStreamingMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.isStreaming) updated[updated.length - 1] = { ...last, id: event.message_id, isStreaming: false };
                  return updated;
                });
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          setStreamingMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isStreaming) updated[updated.length - 1] = { ...last, content: last.content || "An error occurred. Please try again.", isStreaming: false };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        qc.invalidateQueries({ queryKey: ["messages", convId] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
        setTimeout(() => setStreamingMessages([]), 500);
      }
    },
    [convId, isStreaming, qc]
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
