import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true
  },
  actor_id: {
    type: String,
    required: true,
    index: true
  },
  verb: {
    type: String,
    required: true,
    index: true
  },
  object_type: {
    type: String,
    required: true,
    index: true
  },
  object_id: {
    type: String,
    required: true,
    index: true
  },
  target_user_ids: [{
    type: String,
    index: true
  }],
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Denormalized fields for faster queries
  actor_name: String,
  object_title: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
eventSchema.index({ target_user_ids: 1, created_at: -1 });
eventSchema.index({ actor_id: 1, created_at: -1 });
eventSchema.index({ object_type: 1, object_id: 1, created_at: -1 });
eventSchema.index({ verb: 1, created_at: -1 });

// TTL index for automatic cleanup (optional - keep events for 1 year)
eventSchema.index({ created_at: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('Event', eventSchema);