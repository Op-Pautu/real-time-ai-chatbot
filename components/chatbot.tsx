"use client";

import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Message } from "@/types/chat";

import { useMessages } from "@/hooks/useMessages";
import { useConnection } from "@/hooks/useConnection";
import { useChat } from "@/hooks/useChat";

import {
  ChatHeader,
  ChatMessage,
  ChatInput,
  TypingIndicator,
  EmptyState,
} from "@/components/chat";

export default function ChatBot() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message management with localStorage persistence
  const {
    messages,
    addMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    removeStreamingMessage,
    clearMessages,
  } = useMessages();

  // Connection status management
  const {
    status: connectionStatus,
    error,
    reconnect,
    setDisconnected,
    setConnectionError,
    clearError,
  } = useConnection();

  // Chat streaming
  const { isStreaming, isWaiting, streamResponse } = useChat({
    messages,
    onStreamUpdate: updateStreamingMessage,
    onStreamComplete: finalizeStreamingMessage,
    onStreamError: removeStreamingMessage,
    onConnectionError: setDisconnected,
  });

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    if (!input.trim() || isStreaming || connectionStatus === "error") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const messageContent = input.trim();
    setInput("");
    clearError();

    try {
      await streamResponse(messageContent);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get response";
      setConnectionError(errorMessage);
    }
  };

  const getPlaceholder = () => {
    if (connectionStatus === "error") return "API not configured...";
    if (isStreaming) return "AI is responding...";
    return "Type your message...";
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <ChatHeader
        connectionStatus={connectionStatus}
        hasMessages={messages.length > 0}
        onReconnect={reconnect}
        onClear={clearMessages}
      />

      {/* Error Alert */}
      {error && (
        <div className="px-6 pt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isWaiting ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isWaiting && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isStreaming || connectionStatus === "error"}
        isStreaming={isStreaming}
        placeholder={getPlaceholder()}
      />
    </div>
  );
}
