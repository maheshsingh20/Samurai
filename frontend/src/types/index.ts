export interface Event {
  event_id: string;
  actor_id: string;
  actor_name?: string;
  verb: string;
  object_type: string;
  object_id: string;
  object_title?: string;
  target_user_ids: string[];
  created_at: string;
}

export interface FeedResponse {
  items: Event[];
  next_cursor?: string;
  has_more: boolean;
}

export interface Notification {
  id: string;
  event_id: string;
  actor_id: string;
  actor_name?: string;
  verb: string;
  object_type: string;
  object_id: string;
  object_title?: string;
  created_at: string;
  delivered_at: string;
  read: boolean;
  type: string;
}

export interface TopItem {
  item: string;
  count: number;
}

export interface AnalyticsResponse {
  window: string;
  type: string;
  items: TopItem[];
  count: number;
  timestamp: string;
}

export interface RealTimeStats {
  events_per_minute: number;
  top_verbs: Array<{ verb: string; count: number }>;
  top_objects: Array<{ object: string; count: number }>;
  timestamp: string;
}

export interface CreateEventRequest {
  actor_id: string;
  verb: string;
  object_type: string;
  object_id: string;
  target_user_ids?: string[];
  actor_name?: string;
  object_title?: string;
}