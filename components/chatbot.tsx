"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus("connecting");
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
        });

        if (response.ok) {
          setConnectionStatus("connected");
        } else {
          const data = await response.json().catch(() => ({}));
          if (data.error?.includes("not configured")) {
            setConnectionStatus("error");
            setError("API key not configured. Please add GROQ_API_KEY to .env.local");
          } else {
            setConnectionStatus("connected");
          }
        }
      } catch {
        setConnectionStatus("error");
        setError("Failed to connect to API");
      }
    };

    checkConnection();
  }, []);

  const streamResponse = async (userMessage: string) => {
    setIsStreaming(true);
    setIsWaitingForResponse(true);
    setError(null);

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

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                // First content received, stop showing typing indicator
                if (isWaitingForResponse) {
                  setIsWaitingForResponse(false);
                }

                streamingContent += content;

                setMessages((prev) => {
                  const filtered = prev.filter((m) => m.id !== "streaming");
                  return [
                    ...filtered,
                    {
                      id: "streaming",
                      role: "assistant",
                      content: streamingContent,
                      timestamp: new Date(),
                    },
                  ];
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Finalize message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== "streaming");
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: streamingContent,
            timestamp: new Date(),
          },
        ];
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : "Failed to get response from AI";
      setError(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
    } finally {
      setIsStreaming(false);
      setIsWaitingForResponse(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || connectionStatus === "error") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput("");

    await streamResponse(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chatbot</h1>
            <p className="text-sm text-gray-600">
              Powered by Groq - Llama 3.3 70B
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <Wifi className={`w-5 h-5 ${getStatusColor()}`} />
              ) : connectionStatus === "connecting" ? (
                <Loader2 className={`w-5 h-5 ${getStatusColor()} animate-spin`} />
              ) : (
                <WifiOff className={`w-5 h-5 ${getStatusColor()}`} />
              )}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {connectionStatus.charAt(0).toUpperCase() +
                  connectionStatus.slice(1)}
              </span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 pt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isWaitingForResponse ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Start a Conversation
              </h2>
              <p className="text-gray-500">
                Ask me anything! Powered by Llama 3.3 70B
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 shadow-sm border border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 whitespace-pre-wrap break-words">
                      {message.content}
                      {message.id === "streaming" && (
                        <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>
                    {message.id !== "streaming" && (
                      <button
                        onClick={() => copyMessage(message.content, message.id)}
                        className={`flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors ${
                          message.role === "user" ? "hover:bg-blue-500" : ""
                        }`}
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isWaitingForResponse && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                connectionStatus === "error"
                  ? "API not configured..."
                  : isStreaming
                  ? "AI is responding..."
                  : "Type your message..."
              }
              disabled={isStreaming || connectionStatus === "error"}
              className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
              maxLength={2000}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {input.length}/2000
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || connectionStatus === "error"}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Streaming...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send - Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
