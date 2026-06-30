import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import path from 'path';
import { config } from './config';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import issueRoutes from './routes/issue.routes';
import corporationRoutes from './routes/corporation.routes';
import analyticsRoutes from './routes/analytics.routes';
import './workers/media.worker'; // Boot up the background workers
import './workers/ai.worker';
import './workers/gis.worker';
import './workers/notification.worker';
import { initializeSocket } from './config/socket';

// Initialize the Express application
const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
// 1. Helmet adds security-focused HTTP headers to protect against common web vulnerabilities.
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow frontend to fetch images from /uploads
}));

// 2. CORS allows our frontend React app to communicate with this backend API.
app.use(cors({ origin: config.frontendUrl, credentials: true })); 

// 3. Morgan logs every incoming HTTP request to the terminal so we can see what's happening.
app.use(morgan('dev')); 

// 4. Parses incoming raw text requests into beautifully formatted JSON objects inside `req.body`.
app.use(express.json()); 

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// ROUTES
// ==========================================
// Mount the Auth routes under the /api/v1/auth prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/corporations', corporationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Simple health check endpoint to verify the server is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Community Hero API is running' });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================
// We wrap the Express app in a standard Node.js HTTP server.
// (We do this because later in Phase 7, Socket.io requires a raw HTTP server to bind to).
const server = http.createServer(app);
initializeSocket(server); // Attach WebSockets to the HTTP server

const startServer = async () => {
  try {
    // 1. Connect to PostgreSQL and verify PostGIS is installed (from Phase 1.3)
    await connectDB();
    
    // 2. Start listening for HTTP requests
    server.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`🩺 Health check: http://localhost:${config.port}/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
