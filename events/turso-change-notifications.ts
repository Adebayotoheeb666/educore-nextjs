import { createClient } from '@libsql/client';
import { getWebSocketManager } from './websocket-server';
import { getSSEManager } from './sse-manager';

interface TursoChangeNotification {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  oldData?: any;
  timestamp: string;
}

class TursoChangeNotificationManager {
  private client: any;
  private wsManager: any;
  private sseManager: any;
  private isListening: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    this.wsManager = getWebSocketManager();
    this.sseManager = getSSEManager();
  }

  /**
   * Start listening for Turso database changes
   * Since Turso doesn't have built-in change streams like MongoDB,
   * we implement polling-based change detection
   */
  public startListening() {
    if (this.isListening) {
      console.log('Turso change notification listener already running');
      return;
    }

    this.isListening = true;
    console.log('Starting Turso change notification listener');

    // Poll for changes every 5 seconds
    this.pollInterval = setInterval(() => {
      this.pollForChanges();
    }, 5000);
  }

  public stopListening() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isListening = false;
    console.log('Stopped Turso change notification listener');
  }

  private async pollForChanges() {
    try {
      // Check for recent changes in activity_logs table
      const recentChanges = await this.client.execute({
        sql: `
          SELECT * FROM activity_logs
          WHERE created_at > datetime('now', '-5 seconds')
          ORDER BY created_at DESC
          LIMIT 100
        `,
      });

      if (recentChanges.rows.length > 0) {
        for (const row of recentChanges.rows) {
          await this.handleActivityLog(row);
        }
      }

      // Check for new announcements
      const newAnnouncements = await this.client.execute({
        sql: `
          SELECT * FROM announcements
          WHERE created_at > datetime('now', '-5 seconds')
          ORDER BY created_at DESC
          LIMIT 50
        `,
      });

      if (newAnnouncements.rows.length > 0) {
        for (const row of newAnnouncements.rows) {
          await this.handleNewAnnouncement(row);
        }
      }

      // Check for new attendance records
      const newAttendance = await this.client.execute({
        sql: `
          SELECT a.*, c.school_id
          FROM attendance a
          JOIN classes c ON a.class_id = c.id
          WHERE a.created_at > datetime('now', '-5 seconds')
          ORDER BY a.created_at DESC
          LIMIT 100
        `,
      });

      if (newAttendance.rows.length > 0) {
        for (const row of newAttendance.rows) {
          await this.handleNewAttendance(row);
        }
      }

      // Check for new exam results
      const newResults = await this.client.execute({
        sql: `
          SELECT r.*, e.school_id
          FROM results r
          JOIN exams e ON r.exam_id = e.id
          WHERE r.created_at > datetime('now', '-5 seconds')
          ORDER BY r.created_at DESC
          LIMIT 100
        `,
      });

      if (newResults.rows.length > 0) {
        for (const row of newResults.rows) {
          await this.handleNewResult(row);
        }
      }

      // Check for new fee payments
      const newPayments = await this.client.execute({
        sql: `
          SELECT * FROM fee_payments
          WHERE created_at > datetime('now', '-5 seconds')
          ORDER BY created_at DESC
          LIMIT 100
        `,
      });

      if (newPayments.rows.length > 0) {
        for (const row of newPayments.rows) {
          await this.handleNewPayment(row);
        }
      }

    } catch (error) {
      console.error('Error polling for changes:', error);
    }
  }

  private async handleActivityLog(row: any) {
    const notification: TursoChangeNotification = {
      type: 'insert',
      table: 'activity_logs',
      data: row,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to school channel
    if (row.school_id) {
      this.wsManager?.broadcastToSchool(row.school_id, {
        type: 'activity_log',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(row.school_id, {
        type: 'activity_log',
        data: notification,
      });
    }

    // Broadcast to user channel
    if (row.user_id) {
      this.wsManager?.broadcastToUser(row.user_id, {
        type: 'activity_log',
        data: notification,
      });
      this.sseManager?.broadcastToUser(row.user_id, {
        type: 'activity_log',
        data: notification,
      });
    }
  }

  private async handleNewAnnouncement(row: any) {
    const notification: TursoChangeNotification = {
      type: 'insert',
      table: 'announcements',
      data: row,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to school channel
    if (row.school_id) {
      this.wsManager?.broadcastToSchool(row.school_id, {
        type: 'announcement',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(row.school_id, {
        type: 'announcement',
        data: notification,
      });
    }
  }

  private async handleNewAttendance(row: any) {
    const notification: TursoChangeNotification = {
      type: 'insert',
      table: 'attendance',
      data: row,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to school channel
    if (row.school_id) {
      this.wsManager?.broadcastToSchool(row.school_id, {
        type: 'attendance',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(row.school_id, {
        type: 'attendance',
        data: notification,
      });
    }

    // Broadcast to student channel
    if (row.student_id) {
      this.wsManager?.broadcastToUser(row.student_id, {
        type: 'attendance',
        data: notification,
      });
      this.sseManager?.broadcastToUser(row.student_id, {
        type: 'attendance',
        data: notification,
      });
    }
  }

  private async handleNewResult(row: any) {
    const notification: TursoChangeNotification = {
      type: 'insert',
      table: 'results',
      data: row,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to school channel
    if (row.school_id) {
      this.wsManager?.broadcastToSchool(row.school_id, {
        type: 'result',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(row.school_id, {
        type: 'result',
        data: notification,
      });
    }

    // Broadcast to student channel
    if (row.student_id) {
      this.wsManager?.broadcastToUser(row.student_id, {
        type: 'result',
        data: notification,
      });
      this.sseManager?.broadcastToUser(row.student_id, {
        type: 'result',
        data: notification,
      });
    }
  }

  private async handleNewPayment(row: any) {
    const notification: TursoChangeNotification = {
      type: 'insert',
      table: 'fee_payments',
      data: row,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to school channel
    if (row.school_id) {
      this.wsManager?.broadcastToSchool(row.school_id, {
        type: 'payment',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(row.school_id, {
        type: 'payment',
        data: notification,
      });
    }

    // Broadcast to student channel
    if (row.student_id) {
      this.wsManager?.broadcastToUser(row.student_id, {
        type: 'payment',
        data: notification,
      });
      this.sseManager?.broadcastToUser(row.student_id, {
        type: 'payment',
        data: notification,
      });
    }

    // Broadcast to parent channel
    if (row.parent_id) {
      this.wsManager?.broadcastToUser(row.parent_id, {
        type: 'payment',
        data: notification,
      });
      this.sseManager?.broadcastToUser(row.parent_id, {
        type: 'payment',
        data: notification,
      });
    }
  }

  /**
   * Manually trigger a change notification
   * This can be called from API routes after database operations
   */
  public async triggerChange(table: string, operation: 'insert' | 'update' | 'delete', data: any, schoolId?: string) {
    const notification: TursoChangeNotification = {
      type: operation,
      table,
      data,
      timestamp: new Date().toISOString(),
    };

    if (schoolId) {
      this.wsManager?.broadcastToSchool(schoolId, {
        type: 'database_change',
        data: notification,
      });
      this.sseManager?.broadcastToSchool(schoolId, {
        type: 'database_change',
        data: notification,
      });
    }
  }
}

// Singleton instance
let changeNotificationManager: TursoChangeNotificationManager | null = null;

export function getTursoChangeNotificationManager(): TursoChangeNotificationManager {
  if (!changeNotificationManager) {
    changeNotificationManager = new TursoChangeNotificationManager();
  }
  return changeNotificationManager;
}

export { TursoChangeNotificationManager };
