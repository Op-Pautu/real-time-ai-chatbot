import { useState, useCallback, useSyncExternalStore } from "react"
import { Message, CHAT_CONFIG } from "@/types/chat"

// Cache for localStorage snapshot to prevent unnecessary re-parses
let cachedStorageKey: string | null = null
let cachedMessages: Message[] = []
let listeners: Array<() => void> = []
const serverSnapshot: Message[] = []

// Notify all listeners when storage changes
function emitChange() {
  listeners.forEach((listener) => listener())
}

// Helper to load messages from localStorage with caching
function getClientSnapshot(): Message[] {
  try {
    const stored = localStorage.getItem(CHAT_CONFIG.STORAGE_KEY)

    // Only re-parse if storage changed
    if (stored !== cachedStorageKey) {
      cachedStorageKey = stored
      if (stored) {
        const parsed = JSON.parse(stored)
        cachedMessages = parsed.map(
          (m: {
            id: string
            role: "user" | "assistant"
            content: string
            timestamp: string
          }) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }),
        )
      } else {
        cachedMessages = []
      }
    }
  } catch (err) {
    console.error("Failed to load messages:", err)
    cachedMessages = []
  }
  return cachedMessages
}

// For SSR - always return cached empty array
function getServerSnapshot(): Message[] {
  return serverSnapshot
}

// Subscribe function for useSyncExternalStore
function subscribe(callback: () => void): () => void {
  listeners.push(callback)
  // Also listen for cross-tab storage events
  window.addEventListener("storage", callback)
  return () => {
    listeners = listeners.filter((l) => l !== callback)
    window.removeEventListener("storage", callback)
  }
}

// Save messages to localStorage and notify listeners
function saveToStorage(msgs: Message[]) {
  try {
    const serialized = msgs.map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }))
    const json = JSON.stringify(serialized)
    localStorage.setItem(CHAT_CONFIG.STORAGE_KEY, json)
    // Update cache immediately
    cachedStorageKey = json
    cachedMessages = msgs
    emitChange()
  } catch (err) {
    console.error("Failed to save messages:", err)
  }
}

// Clear messages from localStorage
function clearStorage() {
  localStorage.removeItem(CHAT_CONFIG.STORAGE_KEY)
  cachedStorageKey = null
  cachedMessages = []
  emitChange()
}

/**
 * Custom hook for managing chat messages with localStorage persistence
 */
export function useMessages() {
  // Persisted messages from localStorage (SSR-safe via useSyncExternalStore)
  const persistedMessages = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )

  // Streaming message state (not persisted until complete)
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)

  // Combine persisted messages with streaming message for rendering
  const messages = streamingMessage
    ? [...persistedMessages, streamingMessage]
    : persistedMessages

  // Add a new message (persists immediately)
  const addMessage = useCallback((message: Message) => {
    const currentMessages = getClientSnapshot()
    saveToStorage([...currentMessages, message])
  }, [])

  // Update streaming message (not persisted)
  const updateStreamingMessage = useCallback((content: string) => {
    setStreamingMessage({
      id: "streaming",
      role: "assistant",
      content,
      timestamp: new Date(),
    })
  }, [])

  // Finalize streaming message (persists it)
  const finalizeStreamingMessage = useCallback((content: string) => {
    const currentMessages = getClientSnapshot()
    const finalMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
    }
    saveToStorage([...currentMessages, finalMessage])
    setStreamingMessage(null)
  }, [])

  // Remove streaming message (on error)
  const removeStreamingMessage = useCallback(() => {
    setStreamingMessage(null)
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setStreamingMessage(null)
    clearStorage()
  }, [])

  return {
    messages,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    removeStreamingMessage,
    clearMessages,
  }
}
