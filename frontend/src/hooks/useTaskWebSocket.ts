import { useEffect, useRef, useState, useCallback } from 'react';
import { TaskProgressUpdate } from '../types/task';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseTaskWebSocketOptions {
  onUpdate: (update: TaskProgressUpdate) => void;
}

interface UseTaskWebSocketReturn {
  status: ConnectionStatus;
  reconnect: () => void;
}

export function useTaskWebSocket({ onUpdate }: UseTaskWebSocketOptions): UseTaskWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const hasConnectedRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  // Store callback in ref to avoid effect re-runs
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    // Don't connect if unmounted
    if (!mountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const ws = new WebSocket(`${WS_URL}/ws/tasks`);

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      hasConnectedRef.current = true;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return;
        onUpdateRef.current(data as TaskProgressUpdate);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      // Silently handle errors - the onclose will handle reconnection
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;

      // Only show "disconnected" if we had a successful connection before
      if (hasConnectedRef.current) {
        setStatus('disconnected');
      }

      // Reconnect if not a clean close and still mounted
      if (event.code !== 1000 && mountedRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, 3000);
      }
    };

    wsRef.current = ws;
  }, []);

  const reconnect = useCallback(() => {
    setStatus('connecting');
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;

    // Small delay to absorb React StrictMode's double mount/unmount in dev
    const connectTimeout = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(connectTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return { status, reconnect };
}
