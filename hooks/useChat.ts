import { useState, useRef, useCallback } from "react";
import { Message } from "@/types/chat";

interface UseChatOptions {
  messages: Message[];
  onStreamUpdate: (content: string) => void;
  onStreamComplete: (content: string) => void;
  onStreamError: () => void;
  onConnectionError: () => void;
}

/**
 * Custom hook for handling chat streaming with Groq API
 */
export function useChat({
  messages,
  onStreamUpdate,
  onStreamComplete,
  onStreamError,
  onConnectionError,
}: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stream response from API
  const streamResponse = useCallback(async (userMessage: string) => {
    setIsStreaming(true);
    setIsWaiting(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamingContent = "";
      let buffer = ""; // Buffer for incomplete SSE lines

      if (!reader) throw new Error("No response body");

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE messages end with \n\n or \n)
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                setIsWaiting(false);
                streamingContent += content;
                onStreamUpdate(streamingContent);
              }
            } catch {
              // Skip invalid JSON (might be incomplete, will be handled in next chunk)
            }
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim().startsWith("data: ")) {
        const data = buffer.trim().slice(6);
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              streamingContent += content;
              onStreamUpdate(streamingContent);
            }
          } catch {
            // Final chunk was incomplete, ignore
          }
        }
      }

      onStreamComplete(streamingContent);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : "Failed to get response";

      onStreamError();

      if (errorMessage.includes("connect") || errorMessage.includes("network")) {
        onConnectionError();
      }

      throw err;
    } finally {
      setIsStreaming(false);
      setIsWaiting(false);
      abortControllerRef.current = null;
    }
  }, [messages, onStreamUpdate, onStreamComplete, onStreamError, onConnectionError]);

  // Cancel ongoing stream
  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    isStreaming,
    isWaiting,
    streamResponse,
    cancelStream,
  };
}
