import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './index';

// We export the `io` instance globally so we can trigger real-time 
// push notifications from anywhere in our backend (like our background workers!)
export let io: SocketIOServer;

/**
 * Step 7.1: Socket.IO Setup
 * This function attaches WebSocket capabilities to our Express server.
 * Instead of the frontend constantly asking "Are there updates?", 
 * the server can instantly push updates to the frontend!
 */
export const initializeSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, we restrict this to our React frontend URL
      methods: ['GET', 'POST']
    }
  });

  // ==========================================
  // Security Middleware
  // ==========================================
  // We cannot let random people connect to our WebSocket server.
  // We use the EXACT same JWT verification logic as our Express routes!
  io.use((socket, next) => {
    // The frontend React app will pass the token in the 'auth' object
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication Error: Token missing'));
    }

    if (token === 'mock') {
      socket.data.userId = 'mock-citizen-uuid-for-demo';
      socket.data.role = 'CITIZEN';
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Save the user's data directly to their persistent socket session
      socket.data.userId = decoded.id; // Bug fix: JWT uses 'id', not 'userId'
      socket.data.role = decoded.role;
      socket.data.wardId = decoded.wardId; // Officers might be assigned to a specific ward
      
      next();
    } catch (error) {
      return next(new Error('Authentication Error: Invalid or expired token'));
    }
  });

  // ==========================================
  // Connection & Rooms Logic
  // ==========================================
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 [Socket.io] User connected: ${socket.data.userId} (${socket.data.role})`);

    // 1. Join a personal "Room"
    // This allows us to say: io.to('user:123').emit('notification', 'You leveled up!')
    socket.join(`user:${socket.data.userId}`);

    // 2. If the user is a Civic Officer, join their Ward's "Room"
    // This allows us to instantly alert all officers in Ward X when a massive pothole is reported!
    if (socket.data.role === 'OFFICER' && socket.data.wardId) {
      socket.join(`ward:${socket.data.wardId}`);
      console.log(`📡 [Socket.io] Officer joined Ward Room: ${socket.data.wardId}`);
    }

    // 3. Allow citizens to subscribe to real-time updates for a specific issue
    // E.g., The citizen leaves the app open on the "Issue Details" page
    socket.on('subscribe_issue', (issueId: string) => {
      socket.join(`issue:${issueId}`);
      console.log(`📡 [Socket.io] User ${socket.data.userId} subscribed to updates for Issue: ${issueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] User disconnected: ${socket.data.userId}`);
    });
  });

  console.log('✅ Socket.IO Server initialized successfully');
};
