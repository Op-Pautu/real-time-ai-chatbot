import { useState, useCallback, useEffect } from "react";
import { ConnectionStatus, CHAT_CONFIG } from "@/types/chat";

/**
 * Custom hook for managing API connection status
 */
export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Check API connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus("connecting");
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "ping" }],
        }),
      });

      if (response.ok) {
        setStatus("connected");
        setReconnectAttempts(0);
        return true;
      } else {
        const data = await response.json().catch(() => ({}));
        if (data.error?.includes("not configured")) {
          setStatus("error");
          setError("API key not configured. Please add GROQ_API_KEY to .env.local");
        } else {
          setStatus("connected");
        }
        return response.ok;
      }
    } catch {
      setStatus("error");
      setError("Failed to connect to API");
      return false;
    }
  }, []);

  // Attempt reconnection
  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= CHAT_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      setError(`Failed to reconnect after ${CHAT_CONFIG.MAX_RECONNECT_ATTEMPTS} attempts.`);
      return;
    }

    setReconnectAttempts((prev) => prev + 1);
    setStatus("connecting");

    await new Promise((resolve) => setTimeout(resolve, CHAT_CONFIG.RECONNECT_DELAY));
    await checkConnection();
  }, [reconnectAttempts, checkConnection]);

  // Set disconnected status
  const setDisconnected = useCallback(() => {
    setStatus("disconnected");
  }, []);

  // Set error
  const setConnectionError = useCallback((message: string) => {
    setError(message);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    error,
    reconnect,
    setDisconnected,
    setConnectionError,
    clearError,
  };
}
