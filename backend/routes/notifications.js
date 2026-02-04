import express from 'express';
import { notificationManager } from '../server.js';

const router = express.Router();

// GET /notifications - Polling fallback for notifications
router.get('/', async (req, res) => {
  try {
    const { user_id, since, limit = 50 } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const notifications = notificationManager.getNotifications(
      user_id,
      since,
      parseInt(limit)
    );

    res.json({
      notifications,
      count: notifications.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Notifications retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notifications/read - Mark notifications as read
router.post('/read', async (req, res) => {
  try {
    const { user_id } = req.query;
    const { notification_ids } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!Array.isArray(notification_ids)) {
      return res.status(400).json({ error: 'notification_ids must be an array' });
    }

    notificationManager.markAsRead(user_id, notification_ids);

    res.json({
      success: true,
      marked_count: notification_ids.length
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notifications/stats - Notification system statistics
router.get('/stats', (req, res) => {
  try {
    const stats = notificationManager.getConnectionStats();
    res.json(stats);
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;