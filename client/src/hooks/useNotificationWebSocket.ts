import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { notificationKeys } from '@/hooks/useNotifications';

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || (
  window.location.protocol === 'https:' 
    ? `wss://localhost:5000/ws` 
    : `ws://localhost:5000/ws`
);

interface WebSocketMessage {
  type: 'notification' | 'system' | 'error' | 'balance_update';
  data: any;
}

interface BalanceUpdateHandler {
  onBalanceUpdate?: (newBalance: number, amount: number) => void;
}

const useNotificationWebSocket = (userId?: number, handlers?: BalanceUpdateHandler) => {
  // WebSocket disabled: return early to prevent connection attempts
  return {
    isConnected: false,
    sendMessage: () => false,
    connectionAttempts: 0,
  };
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Connect to the WebSocket server
  useEffect(() => {
    if (!userId) return;

    // Max 5 connection attempts
    if (connectionAttempts >= 5) return;
    
    try {
      const ws = new WebSocket(`ws://localhost:5000/ws/notifications?userId=${userId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setConnectionAttempts(0);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            // Invalidate notification queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            
            // Show toast notification for important notifications
            if (message.data.priority === 'high') {
              toast({
                title: message.data.title || 'New notification',
                description: message.data.message,
                variant: 'default',
              });
            }
          } else if (message.type === 'balance_update') {
            // Handle balance updates
            console.log('Balance update received:', message.data);
            
            // Call the balance update handler if provided
            if (handlers?.onBalanceUpdate) {
              handlers.onBalanceUpdate(message.data.newBalance, message.data.amount);
            }
            
            // Invalidate relevant queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            
            // Show toast notification for balance updates
            toast({
              title: message.data.title || 'Balance Updated',
              description: message.data.message,
              variant: 'default',
            });
          } else if (message.type === 'system') {
            // Handle system messages
            console.log('System message:', message.data);
          } else if (message.type === 'error') {
            console.error('WebSocket error message:', message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          setConnectionAttempts(prev => prev + 1);
        }, 5000); // 5 second delay before reconnecting
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setConnectionAttempts(prev => prev + 1);
    }
    
    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userId, connectionAttempts, queryClient, toast, handlers]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [socket, isConnected]);
  
  return {
    isConnected,
    sendMessage,
    connectionAttempts,
  };
};

export default useNotificationWebSocket;
