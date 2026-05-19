/**
 * Real-time Events Module
 * 
 * This module provides real-time communication capabilities for the Educore platform
 * using WebSocket and Server-Sent Events (SSE) to replace MongoDB Change Streams.
 * 
 * Features:
 * - WebSocket server for bidirectional real-time communication
 * - SSE for server-to-client event streaming
 * - Turso change notification polling to replace MongoDB Change Streams
 * - Channel-based subscription system for targeted updates
 * 
 * Usage:
 * 
 * 1. WebSocket (for bidirectional communication):
 *    import { getWebSocketManager } from '@/events';
 *    const wsManager = getWebSocketManager();
 *    wsManager.broadcastToSchool(schoolId, { type: 'announcement', data: {...} });
 * 
 * 2. SSE (for server-to-client streaming):
 *    import { getSSEManager } from '@/events';
 *    const sseManager = getSSEManager();
 *    sseManager.broadcastToUser(userId, { type: 'notification', data: {...} });
 * 
 * 3. Turso Change Notifications (polling-based):
 *    import { getTursoChangeNotificationManager } from '@/events';
 *    const notificationManager = getTursoChangeNotificationManager();
 *    notificationManager.startListening();
 *    notificationManager.triggerChange('announcements', 'insert', data, schoolId);
 */

export { getWebSocketManager, WebSocketManager } from './websocket-server';
export { getSSEManager, SSEManager } from './sse-manager';
export { getTursoChangeNotificationManager, TursoChangeNotificationManager } from './turso-change-notifications';

// Re-export types for convenience
export type { SSEClient } from './sse-manager';
