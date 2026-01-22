import { Wifi, WifiOff, Loader2, Trash2, RefreshCw } from "lucide-react";
import { ConnectionStatus } from "@/types/chat";

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  hasMessages: boolean;
  onReconnect: () => void;
  onClear: () => void;
}

export function ChatHeader({
  connectionStatus,
  hasMessages,
  onReconnect,
  onClear,
}: ChatHeaderProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  const renderStatusIcon = () => {
    if (connectionStatus === "connected") {
      return <Wifi className={`w-5 h-5 ${getStatusColor()}`} />;
    }
    if (connectionStatus === "connecting") {
      return <Loader2 className={`w-5 h-5 ${getStatusColor()} animate-spin`} />;
    }
    return <WifiOff className={`w-5 h-5 ${getStatusColor()}`} />;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chatbot</h1>
          <p className="text-sm text-gray-600">Powered by Groq - Llama 3.3 70B</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {renderStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>

          {/* Reconnect Button */}
          {(connectionStatus === "disconnected" || connectionStatus === "error") && (
            <button
              onClick={onReconnect}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect
            </button>
          )}

          {/* Clear Button */}
          {hasMessages && (
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
