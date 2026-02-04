import axios from 'axios';

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

export interface DynamicUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  company?: string;
  website?: string;
  city?: string;
  isOnline: boolean;
  lastSeen: string;
  followers: number;
  following: number;
}

export interface DynamicContent {
  posts: Array<{
    id: string;
    title: string;
    body: string;
    userId: string;
    type: string;
  }>;
  photos: Array<{
    id: string;
    title: string;
    url?: string;
    thumbnailUrl?: string;
    userId: string;
    type: string;
  }>;
  videos: Array<{
    id: string;
    title: string;
    duration: string;
    views: number;
    userId: string;
    type: string;
  }>;
  articles: Array<{
    id: string;
    title: string;
    readTime: string;
    publishedAt: string;
    userId: string;
    type: string;
  }>;
  products: Array<{
    id: string;
    title: string;
    price: number;
    rating: string;
    reviews: number;
    userId: string;
    type: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    completed?: boolean;
    userId: string;
    type: string;
  }>;
}

export interface TrendingTopic {
  name: string;
  posts: number;
  trend: 'up' | 'down';
  change: string;
}

export const dynamicApi = {
  // Get dynamic users from external APIs
  getUsers: async (): Promise<DynamicUser[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get dynamic content from external APIs
  getContent: async (): Promise<DynamicContent> => {
    const response = await api.get('/content');
    return response.data;
  },

  // Get trending topics
  getTrending: async (): Promise<TrendingTopic[]> => {
    const response = await api.get('/trending');
    return response.data;
  },

  // Generate dynamic event
  generateEvent: async (): Promise<any> => {
    const response = await api.post('/events/generate');
    return response.data;
  }
};

export default dynamicApi;