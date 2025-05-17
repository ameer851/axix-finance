import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { DatabaseStorage } from './storage';

// Create a storage instance for database interactions
const storage = new DatabaseStorage();

// Map to store active connections with userId as key
const connections: Map<number, Set<WebSocket>> = new Map();

// Define interfaces
interface NotificationPayload {
  type: string;
  data: any;
}

// Create and configure WebSocket server
export function setupWebSocketServer(server: HTTPServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, userId: number) => {
    console.log(`WebSocket connected for user ${userId}`);
    
    // Store the connection
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)?.add(ws);
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'system',
      data: { message: 'Connected to CaraxFinance notification server' }
    }));
    
    // Handle messages from the client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from user ${userId}:`, data);
        
        // Handle different message types here if needed
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket disconnected for user ${userId}`);
      connections.get(userId)?.delete(ws);
      
      // Clean up empty sets
      if (connections.get(userId)?.size === 0) {
        connections.delete(userId);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  });
  
  // Handle upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname, query } = parse(request.url || '', true);
    
    // Only handle WebSocket connections to /ws/notifications
    if (pathname === '/ws/notifications') {
      const userId = query.userId ? parseInt(query.userId as string) : null;
      
      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      
      // Verify the user exists (you could add more authentication here)
      storage.getUser(userId)
        .then(user => {
          if (!user) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, userId);
          });
        })
        .catch(error => {
          console.error('Error verifying user for WebSocket connection:', error);
          socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
          socket.destroy();
        });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });
  
  return wss;
}

// Function to send a notification to a specific user
export function sendNotification(userId: number, notification: any) {
  const userConnections = connections.get(userId);
  
  if (!userConnections || userConnections.size === 0) {
    return false; // No active connections for this user
  }
  
  const message = JSON.stringify({
    type: 'notification',
    data: notification
  });
    // Send to all connections for this user
  userConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
  
  return true;
}

// Function to broadcast a message to all connected users
export function broadcastMessage(message: any) {
  const payload = JSON.stringify({
    type: 'system',
    data: message
  });
  
  connections.forEach((userConnections, userId) => {
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  });
}
