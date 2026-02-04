import axios from 'axios';
import { Event, FeedResponse, Notification, AnalyticsResponse, RealTimeStats, CreateEventRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add user_id header to all requests
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id') || 'user_1';
  config.headers['user_id'] = userId;
  return config;
});

export const eventApi = {
  create: async (event: CreateEventRequest): Promise<{ event_id: string }> => {
    console.log('Making API request to create event:', event);
    console.log('API Base URL:', API_BASE_URL);
    try {
      const response = await api.post('/events', event);
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  getById: async (eventId: string): Promise<Event> => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  }
};

export const feedApi = {
  getFeed: async (params: {
    user_id?: string;
    cursor?: string;
    limit?: number;
    include_own?: boolean;
  } = {}): Promise<FeedResponse> => {
    const response = await api.get('/feed', { params });
    return response.data;
  },

  getStats: async (user_id?: string) => {
    const response = await api.get('/feed/stats', { 
      params: { user_id } 
    });
    return response.data;
  }
};

export const notificationApi = {
  getNotifications: async (params: {
    user_id?: string;
    since?: string;
    limit?: number;
  } = {}): Promise<{ notifications: Notification[]; count: number; timestamp: string }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (user_id: string, notification_ids: string[]): Promise<{ success: boolean; marked_count: number }> => {
    const response = await api.post(`/notifications/read?user_id=${user_id}`, {
      notification_ids
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  }
};

export const analyticsApi = {
  getTop: async (params: {
    window?: '1m' | '5m' | '1h';
    type?: 'objects' | 'verbs' | 'objectTypes';
    limit?: number;
  } = {}): Promise<AnalyticsResponse> => {
    const response = await api.get('/top', { params });
    return response.data;
  },

  getRealTime: async (): Promise<RealTimeStats> => {
    const response = await api.get('/top/realtime');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/top/stats');
    return response.data;
  }
};

export default api;