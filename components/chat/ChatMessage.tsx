import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isStreaming = message.id === "streaming";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-900 shadow-sm border border-gray-200"
        }`}
      >
        {/* Content */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 whitespace-pre-wrap break-words prose prose-sm max-w-none">
            {!isUser ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
                    ) : (
                      <code className="block bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2">{children}</pre>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2">{children}</ol>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content
            )}

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>

          {/* Copy button */}
          {!isStreaming && (
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 p-1 rounded transition-colors ${
                isUser ? "hover:bg-blue-500" : "hover:bg-gray-100"
              }`}
              title="Copy message"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
