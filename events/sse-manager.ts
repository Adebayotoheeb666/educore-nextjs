import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import { query } from '@/lib/db/turso';

export interface SSEClient {
  id: string;
  userId: string;
  schoolId: string | null;
  role: string;
  channels: Set<string>;
  controller: ReadableStreamDefaultController;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private channelSubscribers: Map<string, Set<string>> = new Map();

  constructor() {
    // Clean up disconnected clients periodically
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    this.clients.forEach((client, id) => {
      // Remove clients that haven't sent a keepalive in 5 minutes
      // This is handled by the client sending keepalive pings
    });
  }

  public async addClient(
    req: NextRequest,
    controller: ReadableStreamDefaultController
  ): Promise<SSEClient | null> {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                   req.cookies.get('token')?.value;

      if (!token) {
        return null;
      }

      const payload = verifyToken(token);
      
      const user = await query(
        `SELECT id, school_id, role FROM users WHERE id = ? AND is_active = 1`,
        [payload.id]
      );

      if (!user || user.length === 0) {
        return null;
      }

      const userData = user[0] as any;
      const clientId = `${userData.id}-${Date.now()}`;

      const client: SSEClient = {
        id: clientId,
        userId: userData.id,
        schoolId: userData.school_id,
        role: userData.role,
        channels: new Set(),
        controller,
      };

      this.clients.set(clientId, client);

      // Auto-subscribe to user-specific and school-specific channels
      this.subscribe(clientId, `user:${userData.id}`);
      if (userData.school_id) {
        this.subscribe(clientId, `school:${userData.school_id}`);
        this.subscribe(clientId, `school:${userData.school_id}:${userData.role}`);
      }

      // Send initial connection message
      this.sendToClient(clientId, {
        type: 'connected',
        data: { userId: userData.id, schoolId: userData.school_id },
      });

      return client;
    } catch (error) {
      console.error('SSE client addition error:', error);
      return null;
    }
  }

  public removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all channel subscriptions
      client.channels.forEach(channel => {
        const subscribers = this.channelSubscribers.get(channel);
        if (subscribers) {
          subscribers.delete(clientId);
          if (subscribers.size === 0) {
            this.channelSubscribers.delete(channel);
          }
        }
      });

      this.clients.delete(clientId);
    }
  }

  public subscribe(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(clientId);

    this.sendToClient(clientId, {
      type: 'subscribed',
      data: { channel },
    });
  }

  public unsubscribe(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);

    const subscribers = this.channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channel);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      data: { channel },
    });
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = `data: ${JSON.stringify(message)}\n\n`;
      client.controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error('SSE send error:', error);
      this.removeClient(clientId);
    }
  }

  public broadcast(channel: string, message: any) {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return;

    const data = {
      type: 'broadcast',
      channel,
      data: message,
      timestamp: new Date().toISOString(),
    };

    subscribers.forEach(clientId => {
      this.sendToClient(clientId, data);
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
let sseManager: SSEManager | null = null;

export function getSSEManager(): SSEManager {
  if (!sseManager) {
    sseManager = new SSEManager();
  }
  return sseManager;
}

export { SSEManager };
