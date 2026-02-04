import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Event from '../models/Event.js';
import { notificationManager, analyticsService, dynamicDataService } from '../server.js';

const router = express.Router();

// POST /events - Event ingestion with dynamic data
router.post('/', async (req, res) => {
  try {
    let {
      actor_id,
      verb,
      object_type,
      object_id,
      target_user_ids = [],
      created_at,
      actor_name,
      object_title
    } = req.body;

    // If no data provided, generate completely dynamic event
    if (!actor_id || !verb || !object_type || !object_id) {
      const dynamicEvent = await dynamicDataService.generateRealisticEvent();
      actor_id = dynamicEvent.actor_id;
      verb = dynamicEvent.verb;
      object_type = dynamicEvent.object_type;
      object_id = dynamicEvent.object_id;
      target_user_ids = dynamicEvent.target_user_ids;
      actor_name = dynamicEvent.actor_name;
      object_title = dynamicEvent.object_title;
    } else {
      // Enrich provided data with dynamic information
      if (!actor_name && actor_id) {
        const user = await dynamicDataService.getUserById(actor_id);
        actor_name = user?.name;
      }

      if (!object_title && object_id && object_type) {
        const content = await dynamicDataService.getContentById(object_id, object_type);
        object_title = content?.title;
      }
    }

    const event_id = uuidv4();
    const eventData = {
      event_id,
      actor_id,
      verb,
      object_type,
      object_id,
      target_user_ids: Array.isArray(target_user_ids) ? target_user_ids : [target_user_ids],
      created_at: created_at ? new Date(created_at) : new Date(),
      actor_name,
      object_title
    };

    // Save to database
    const event = new Event(eventData);
    await event.save();

    // Update analytics
    analyticsService.recordEvent(verb, object_id, object_type);

    // Send real-time notifications to target users
    if (target_user_ids.length > 0) {
      const notification = {
        event_id,
        actor_id,
        actor_name,
        verb,
        object_type,
        object_id,
        object_title,
        created_at: eventData.created_at,
        type: 'activity'
      };

      target_user_ids.forEach(userId => {
        notificationManager.sendNotification(userId, notification);
      });
    }

    res.status(201).json({ event_id, generated: !req.body.actor_id });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /events/generate - Generate dynamic event
router.post('/generate', async (req, res) => {
  try {
    const dynamicEvent = await dynamicDataService.generateRealisticEvent();

    const event_id = uuidv4();
    const eventData = {
      event_id,
      ...dynamicEvent,
      target_user_ids: Array.isArray(dynamicEvent.target_user_ids) ? dynamicEvent.target_user_ids : [dynamicEvent.target_user_ids],
      created_at: new Date(dynamicEvent.created_at)
    };

    // Save to database
    const event = new Event(eventData);
    await event.save();

    // Update analytics
    analyticsService.recordEvent(dynamicEvent.verb, dynamicEvent.object_id, dynamicEvent.object_type);

    // Send real-time notifications
    if (dynamicEvent.target_user_ids.length > 0) {
      const notification = {
        event_id,
        actor_id: dynamicEvent.actor_id,
        actor_name: dynamicEvent.actor_name,
        verb: dynamicEvent.verb,
        object_type: dynamicEvent.object_type,
        object_id: dynamicEvent.object_id,
        object_title: dynamicEvent.object_title,
        created_at: eventData.created_at,
        type: 'activity'
      };

      dynamicEvent.target_user_ids.forEach(userId => {
        notificationManager.sendNotification(userId, notification);
      });
    }

    res.status(201).json({
      event_id,
      event: dynamicEvent,
      message: 'Dynamic event generated successfully'
    });
  } catch (error) {
    console.error('Dynamic event generation error:', error);
    res.status(500).json({ error: 'Failed to generate dynamic event' });
  }
});

// GET /events/:id - Get specific event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ event_id: req.params.id });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Event retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;