// // app/api/notifications/stream/route.ts
// import { NextResponse } from "next/server";

// // Simple in-memory store for clients
// const clients: Map<string, ReadableStreamDefaultController> = new Map();

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userId = searchParams.get('userId');
//     const userRole = searchParams.get('userRole');

//     console.log('SSE connection attempt:', { userId, userRole });

//     if (userRole !== '2222') {
//       return NextResponse.json({ error: 'Access denied' }, { status: 403 });
//     }

//     if (!userId) {
//       return NextResponse.json({ error: 'User ID required' }, { status: 400 });
//     }

//     const encoder = new TextEncoder();

//     const stream = new ReadableStream({
//       start(controller) {
//         const clientId = `${userId}-${Date.now()}`;
//         clients.set(clientId, controller);

//         console.log('Client connected:', clientId);

//         // Send initial connection message
//         try {
//           const data = `data: ${JSON.stringify({ 
//             type: 'connected', 
//             message: 'Notification stream connected',
//             timestamp: new Date().toISOString()
//           })}\n\n`;
//           controller.enqueue(encoder.encode(data));
//         } catch (error) {
//           console.error('Error sending connection message:', error);
//         }

//         // Clean up on disconnect
//         request.signal.addEventListener('abort', () => {
//           console.log('Client disconnected:', clientId);
//           clients.delete(clientId);
//           controller.close();
//         });
//       },
      
//       cancel() {
//         console.log('Stream cancelled');
//       }
//     });

//     return new Response(stream, {
//       headers: {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache, no-transform',
//         'Connection': 'keep-alive',
//         'Content-Encoding': 'none',
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Cache-Control'
//       },
//     });

//   } catch (error) {
//     console.error('SSE endpoint error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// // Helper function to send notifications
// export function sendNotification(notificationData: any) {
//   const encoder = new TextEncoder();
  
//   if (clients.size === 0) {
//     console.log('No clients connected');
//     return;
//   }

//   try {
//     const message = `data: ${JSON.stringify({
//       ...notificationData,
//       timestamp: new Date().toISOString()
//     })}\n\n`;

//     clients.forEach((controller, clientId) => {
//       try {
//         controller.enqueue(encoder.encode(message));
//         console.log('Notification sent to client:', clientId);
//       } catch (error) {
//         console.error('Error sending to client', clientId, error);
//         clients.delete(clientId);
//       }
//     });
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }
// }