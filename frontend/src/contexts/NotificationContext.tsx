import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Notification } from '../types';
import { WebSocketService, WebSocketMessage } from '../services/websocket';
import { notificationApi } from '../services/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: string;
  markAsRead: (notificationIds: string[]) => void;
  clearAll: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');
  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  const userId = localStorage.getItem('user_id') || 'user_1';

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      const notification = message.data as Notification;
      setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
    } else if (message.type === 'pending_notifications') {
      const pendingNotifications = message.data as Notification[];
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifications = pendingNotifications.filter(n => !existingIds.has(n.id));
        return [...newNotifications, ...prev].slice(0, 100);
      });
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications({
        user_id: userId,
        limit: 50
      });
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationApi.markAsRead(userId, notificationIds);
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [userId]);

  const clearAll = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  useEffect(() => {
    const service = new WebSocketService(userId);
    setWsService(service);

    service.addListener(handleWebSocketMessage);

    // Connect WebSocket
    service.connect()
      .then(() => {
        setConnectionStatus('CONNECTED');
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        setConnectionStatus('FAILED');
      });

    // Monitor connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(service.getConnectionState());
    }, 1000);

    // Load initial notifications
    refreshNotifications();

    return () => {
      clearInterval(statusInterval);
      service.removeListener(handleWebSocketMessage);
      service.disconnect();
    };
  }, [userId, handleWebSocketMessage, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    clearAll,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};