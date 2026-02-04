import express from 'express';
import { analyticsService } from '../server.js';

const router = express.Router();

// GET /top - Get top items for specified time window
router.get('/', async (req, res) => {
  try {
    const {
      window = '1h',
      type = 'objects',
      limit = 100
    } = req.query;

    // Validate window parameter
    if (!['1m', '5m', '1h'].includes(window)) {
      return res.status(400).json({
        error: 'Invalid window. Must be one of: 1m, 5m, 1h'
      });
    }

    // Validate type parameter
    if (!['objects', 'verbs', 'objectTypes'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: objects, verbs, objectTypes'
      });
    }

    const topItems = analyticsService.getTopItems(
      window,
      type,
      Math.min(parseInt(limit), 1000) // Max 1000 items
    );

    res.json({
      window,
      type,
      items: topItems,
      count: topItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /top/realtime - Real-time analytics dashboard
router.get('/realtime', (req, res) => {
  try {
    const stats = analyticsService.getRealTimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /top/stats - Analytics system statistics
router.get('/stats', (req, res) => {
  try {
    const stats = analyticsService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;