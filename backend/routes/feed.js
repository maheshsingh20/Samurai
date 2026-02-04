import express from 'express';
import Event from '../models/Event.js';
import { cache } from '../server.js';

const router = express.Router();

// GET /feed - Feed retrieval with pagination
router.get('/', async (req, res) => {
  try {
    const {
      user_id,
      cursor,
      limit = 20,
      include_own = 'true'
    } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const pageLimit = Math.min(parseInt(limit), 100); // Max 100 items per page

    // Build query
    const query = {
      $or: [
        { target_user_ids: user_id }
      ]
    };

    // Include user's own activities if requested
    if (include_own === 'true') {
      query.$or.push({ actor_id: user_id });
    }

    // Handle cursor-based pagination
    if (cursor) {
      try {
        const cursorDate = new Date(Buffer.from(cursor, 'base64').toString());
        query.created_at = { $lt: cursorDate };
      } catch (error) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }

    // Check cache first
    const cacheKey = `feed:${user_id}:${cursor || 'first'}:${pageLimit}:${include_own}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Query database
    const events = await Event.find(query)
      .sort({ created_at: -1 })
      .limit(pageLimit + 1) // Get one extra to check if there are more
      .lean();

    // Prepare response
    const hasMore = events.length > pageLimit;
    const items = hasMore ? events.slice(0, pageLimit) : events;

    let next_cursor = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      next_cursor = Buffer.from(lastItem.created_at.toISOString()).toString('base64');
    }

    const result = {
      items: items.map(event => ({
        event_id: event.event_id,
        actor_id: event.actor_id,
        actor_name: event.actor_name,
        verb: event.verb,
        object_type: event.object_type,
        object_id: event.object_id,
        object_title: event.object_title,
        created_at: event.created_at,
        target_user_ids: event.target_user_ids
      })),
      next_cursor,
      has_more: hasMore
    };

    // Cache the result for 2 minutes
    cache.set(cacheKey, result, 120);

    res.json(result);
  } catch (error) {
    console.error('Feed retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /feed/stats - Feed statistics
router.get('/stats', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const cacheKey = `feed_stats:${user_id}`;
    const cachedStats = cache.get(cacheKey);

    if (cachedStats) {
      return res.json(cachedStats);
    }

    const [totalEvents, recentEvents] = await Promise.all([
      Event.countDocuments({
        $or: [
          { target_user_ids: user_id },
          { actor_id: user_id }
        ]
      }),
      Event.countDocuments({
        $or: [
          { target_user_ids: user_id },
          { actor_id: user_id }
        ],
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    const stats = {
      total_events: totalEvents,
      recent_events_24h: recentEvents,
      last_updated: new Date().toISOString()
    };

    // Cache for 5 minutes
    cache.set(cacheKey, stats, 300);

    res.json(stats);
  } catch (error) {
    console.error('Feed stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;