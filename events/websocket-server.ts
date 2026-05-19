import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/utils/jwt';
import { query } from '@/lib/db/turso';

interface Client {
  ws: WebSocket;
  userId: string;
  schoolId: string | null;
  role: string;
  channels: Set<string>;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Client> = new Map();
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined') return; // Don't run on client

    try {
      this.wss = new WebSocketServer({ port: parseInt(process.env.WS_PORT || '3001') });
      
      this.wss.on('connection', (ws: WebSocket, req) => {
        this.handleConnection(ws, req);
      });

      console.log('WebSocket server initialized on port', process.env.WS_PORT || '3001');
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
    }
  }

  private async handleConnection(ws: WebSocket, req: any) {
    try {
      // Extract token from query params or headers
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      // Verify token
      const payload = verifyToken(token);
      
      // Get user details
      const user = await query(
        `SELECT id, school_id, role FROM users WHERE id = ? AND is_active = 1`,
        [payload.id]
      );

      if (!user || user.length === 0) {
        ws.close(1008, 'Invalid user');
        return;
      }

      const userData = user[0] as any;
      const client: Client = {
        ws,
        userId: userData.id,
        schoolId: userData.school_id,
        role: userData.role,
        channels: new Set(),
      };

      this.clients.set(ws, client);

      // Auto-subscribe to user-specific and school-specific channels
      this.subscribe(ws, `user:${userData.id}`);
      if (userData.school_id) {
        this.subscribe(ws, `school:${userData.school_id}`);
        this.subscribe(ws, `school:${userData.school_id}:${userData.role}`);
      }

      ws.on('message', (data: Buffer) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleDisconnect(ws));
      ws.on('error', (error) => console.error('WebSocket error:', error));

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: { userId: userData.id, schoolId: userData.school_id },
      });

      console.log(`Client connected: ${userData.id} (${userData.role})`);
    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(ws: WebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(ws);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.subscribe(ws, message.channel);
          break;
        case 'unsubscribe':
          this.unsubscribe(ws, message.channel);
          break;
        case 'ping':
          this.sendToClient(ws, { type: 'pong' });
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (client) {
      // Remove from all channel subscriptions
      client.channels.forEach(channel => {
        const subscribers = this.channelSubscribers.get(channel);
        if (subscribers) {
          subscribers.delete(ws);
          if (subscribers.size === 0) {
            this.channelSubscribers.delete(channel);
          }
        }
      });

      this.clients.delete(ws);
      console.log(`Client disconnected: ${client.userId}`);
    }
  }

  private subscribe(ws: WebSocket, channel: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(ws);

    this.sendToClient(ws, {
      type: 'subscribed',
      data: { channel },
    });
  }

  private unsubscribe(ws: WebSocket, channel: string) {
    const client = this.clients.get(ws);
    if (!client) return;

    client.channels.delete(channel);

    const subscribers = this.channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channel);
      }
    }

    this.sendToClient(ws, {
      type: 'unsubscribed',
      data: { channel },
    });
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Public methods for broadcasting
  public broadcast(channel: string, message: any) {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return;

    const data = JSON.stringify({
      type: 'broadcast',
      channel,
      data: message,
      timestamp: new Date().toISOString(),
    });

    subscribers.forEach(ws => {
      this.sendToClient(ws, { type: 'message', channel, data: message });
    });
  }

  public broadcastToSchool(schoolId: string, message: any) {
    this.broadcast(`school:${schoolId}`, message);
  }

  public broadcastToUser(userId: string, message: any) {
    this.broadcast(`user:${userId}`, message);
  }

  public broadcastToRole(schoolId: string, role: string, message: any) {
    this.broadcast(`school:${schoolId}:${role}`, message);
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getChannelSubscribers(channel: string): number {
    return this.channelSubscribers.get(channel)?.size || 0;
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

// Export for use in API routes
export { WebSocketManager };
