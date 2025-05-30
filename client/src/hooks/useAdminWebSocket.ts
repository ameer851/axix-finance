import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminNotification {
  type: 'deposit' | 'withdrawal' | 'user_registration' | 'transaction' | 'system';
  data: any;
  timestamp: string;
}

export function useAdminWebSocket() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect if user is admin
    if (!user || user.role !== 'admin') {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Admin WebSocket connected');
        setIsConnected(true);
        
        // Send authentication/subscription message for admin events
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'admin',
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as AdminNotification;
          
          // Add timestamp if not present
          if (!notification.timestamp) {
            notification.timestamp = new Date().toISOString();
          }
          
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Admin WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    sendMessage,
    clearNotifications
  };
}
