/**
 * LEGGOOO Backend Server
 * 
 * Express server with:
 * - REST API endpoints
 * - y-websocket server for real-time collaboration
 * - Security middleware (helmet, cors, rate-limit)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createYjsServer } from './yjs-server.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import fileRoutes from './routes/files.js';
import githubRoutes from './routes/github.js';
import aiRoutes from './routes/ai.js';
import snapshotRoutes from './routes/snapshots.js';

// Load environment variables
config();

const app: express.Application = express();
const PORT = process.env.PORT || 3001;
const YJS_PORT = process.env.YJS_PORT || 1234;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for AI endpoints (from security_checklist.md)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'AI rate limit exceeded. Please wait before sending more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for push endpoints
const pushLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 pushes per minute
  message: { error: 'Push rate limit exceeded. Please wait before pushing again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);
app.use('/api/workspaces/:id/push', pushLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      yjs: 'running',
    },
  });
});

// API Routes placeholder
app.get('/api/v1/status', (_req, res) => {
  res.json({ 
    message: 'LEGGOOO API is running',
    version: '0.1.0',
  });
});

// Auth routes
app.use('/auth', authRoutes);

// Workspace routes
app.use('/api/workspaces', workspaceRoutes);

// File routes
app.use('/api', fileRoutes);

// GitHub routes
app.use('/api/github', githubRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Snapshot routes
app.use('/api/snapshots', snapshotRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start servers
async function main() {
  // Start Express API server
  app.listen(PORT, () => {
    console.log(`[API] Server running on http://localhost:${PORT}`);
  });

  // Start y-websocket server
  createYjsServer(Number(YJS_PORT));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
