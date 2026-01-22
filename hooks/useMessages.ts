import { useState, useCallback } from "react";
import { Message, CHAT_CONFIG } from "@/types/chat";

// Helper to load messages from localStorage (outside component to avoid recreation)
function loadFromStorage(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CHAT_CONFIG.STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((m: { id: string; role: "user" | "assistant"; content: string; timestamp: string }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
  } catch (err) {
    console.error("Failed to load messages:", err);
  }
  return [];
}

/**
 * Custom hook for managing chat messages with localStorage persistence
 */
export function useMessages() {
  // Initialize state from localStorage using lazy initialization
  const [messages, setMessages] = useState<Message[]>(loadFromStorage);

  // Save messages to localStorage
  const saveToStorage = useCallback((msgs: Message[]) => {
    try {
      const serialized = msgs.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      localStorage.setItem(CHAT_CONFIG.STORAGE_KEY, JSON.stringify(serialized));
    } catch (err) {
      console.error("Failed to save messages:", err);
    }
  }, []);

  // Add a new message
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const newMessages = [...prev, message];
      saveToStorage(newMessages);
      return newMessages;
    });
  }, [saveToStorage]);

  // Update streaming message
  const updateStreamingMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== "streaming");
      return [
        ...filtered,
        {
          id: "streaming",
          role: "assistant" as const,
          content,
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  // Finalize streaming message
  const finalizeStreamingMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== "streaming");
      const finalMessages = [
        ...filtered,
        {
          id: Date.now().toString(),
          role: "assistant" as const,
          content,
          timestamp: new Date(),
        },
      ];
      saveToStorage(finalMessages);
      return finalMessages;
    });
  }, [saveToStorage]);

  // Remove streaming message (on error)
  const removeStreamingMessage = useCallback(() => {
    setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_CONFIG.STORAGE_KEY);
  }, []);

  return {
    messages,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    removeStreamingMessage,
    clearMessages,
  };
}
