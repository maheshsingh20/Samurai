import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import NodeCache from 'node-cache';

import eventRoutes from './routes/events.js';
import feedRoutes from './routes/feed.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import { NotificationManager } from './services/NotificationManager.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { DynamicDataService } from './services/DynamicDataService.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3002;

// Global cache instance
export const cache = new NodeCache({ stdTTL: 300 }); // 5 min default TTL

// Initialize services
export const notificationManager = new NotificationManager();
export const analyticsService = new AnalyticsService();
export const dynamicDataService = new DynamicDataService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Mock auth middleware - extracts user_id from header
app.use((req, res, next) => {
  req.userId = req.headers['user_id'] || req.query.user_id;
  next();
});

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/top', analyticsRoutes);

// Dynamic data endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await dynamicDataService.getDynamicUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/content', async (req, res) => {
  try {
    const content = await dynamicDataService.getDynamicContent();
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const trending = await dynamicDataService.getTrendingTopics();
    res.json(trending);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket setup for real-time notifications
const wss = new WebSocketServer({
  server,
  path: '/notifications'
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    ws.close(1008, 'user_id required');
    return;
  }

  notificationManager.addConnection(userId, ws);

  ws.on('close', () => {
    notificationManager.removeConnection(userId, ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    notificationManager.removeConnection(userId, ws);
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/activity_feed');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  // Initialize dynamic data
  console.log('Initializing dynamic data services...');
  await dynamicDataService.getDynamicUsers();
  await dynamicDataService.getDynamicContent();
  console.log('Dynamic data services initialized');

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready at ws://localhost:${PORT}/notifications`);
    console.log('🎯 System ready - Events will be created only when users perform actions');
  });
};

startServer().catch(console.error);

export { app, server };