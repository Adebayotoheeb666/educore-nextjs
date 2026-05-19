import { NextRequest } from 'next/server';
import { getSSEManager } from '@/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sseManager = getSSEManager();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Add client to SSE manager
      const client = await sseManager.addClient(req, controller);
      
      if (!client) {
        controller.close();
        return;
      }

      // Send keepalive every 30 seconds
      const keepalive = setInterval(() => {
        try {
          const keepaliveData = `: keepalive\n\n`;
          controller.enqueue(encoder.encode(keepaliveData));
        } catch (error) {
          clearInterval(keepalive);
          sseManager.removeClient(client.id);
        }
      }, 30000);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        sseManager.removeClient(client.id);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
