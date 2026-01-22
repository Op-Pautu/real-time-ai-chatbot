import { Send, Loader2 } from "lucide-react";
import { CHAT_CONFIG } from "@/types/chat";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isStreaming,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
      <div className="flex items-end gap-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          />
          {/* Character count */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {value.length}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
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

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press Enter to send - Shift+Enter for new line
      </div>
    </div>
  );
}
