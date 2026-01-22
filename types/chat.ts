export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/**
 * Constants for chat configuration
 */
export const CHAT_CONFIG = {
  STORAGE_KEY: "chatbot_messages",
  MAX_RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,
  MAX_MESSAGE_LENGTH: 2000,
} as const;
