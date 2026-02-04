import { WebSocket } from 'ws';

export class NotificationManager {
  constructor() {
    this.connections = new Map(); // userId -> Set of WebSocket connections
    this.userNotifications = new Map(); // userId -> Array of recent notifications
    this.maxNotificationsPerUser = 1000;
  }

  addConnection(userId, ws) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(ws);

    console.log(`User ${userId} connected. Total connections: ${this.getTotalConnections()}`);

    // Send any pending notifications
    this.sendPendingNotifications(userId, ws);
  }

  removeConnection(userId, ws) {
    if (this.connections.has(userId)) {
      this.connections.get(userId).delete(ws);
      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }

    console.log(`User ${userId} disconnected. Total connections: ${this.getTotalConnections()}`);
  }

  sendNotification(userId, notification) {
    // Store notification for polling fallback
    this.storeNotification(userId, notification);

    // Send to active WebSocket connections
    if (this.connections.has(userId)) {
      const userConnections = this.connections.get(userId);
      const message = JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      });

      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
          } catch (error) {
            console.error('Error sending notification:', error);
            this.removeConnection(userId, ws);
          }
        } else {
          this.removeConnection(userId, ws);
        }
      });
    }
  }

  storeNotification(userId, notification) {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }

    const notifications = this.userNotifications.get(userId);
    notifications.unshift({
      ...notification,
      id: `${notification.event_id}_${Date.now()}`,
      delivered_at: new Date().toISOString(),
      read: false
    });

    // Keep only recent notifications
    if (notifications.length > this.maxNotificationsPerUser) {
      notifications.splice(this.maxNotificationsPerUser);
    }
  }

  getNotifications(userId, since = null, limit = 50) {
    const notifications = this.userNotifications.get(userId) || [];

    let filtered = notifications;
    if (since) {
      const sinceDate = new Date(since);
      filtered = notifications.filter(n => new Date(n.delivered_at) > sinceDate);
    }

    return filtered.slice(0, limit);
  }

  markAsRead(userId, notificationIds) {
    const notifications = this.userNotifications.get(userId) || [];
    notifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });
  }

  sendPendingNotifications(userId, ws) {
    const recentNotifications = this.getNotifications(userId, null, 10);
    if (recentNotifications.length > 0) {
      const message = JSON.stringify({
        type: 'pending_notifications',
        data: recentNotifications,
        timestamp: new Date().toISOString()
      });

      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error sending pending notifications:', error);
        }
      }
    }
  }

  getTotalConnections() {
    let total = 0;
    this.connections.forEach(userConnections => {
      total += userConnections.size;
    });
    return total;
  }

  getConnectionStats() {
    return {
      total_connections: this.getTotalConnections(),
      connected_users: this.connections.size,
      total_stored_notifications: Array.from(this.userNotifications.values())
        .reduce((sum, notifications) => sum + notifications.length, 0)
    };
  }

  // Cleanup old notifications periodically
  cleanup() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    this.userNotifications.forEach((notifications, userId) => {
      const filtered = notifications.filter(n => new Date(n.delivered_at) > cutoffTime);
      if (filtered.length !== notifications.length) {
        this.userNotifications.set(userId, filtered);
      }
    });
  }
}

// Cleanup old notifications every hour
setInterval(() => {
  // This will be called on the instance created in server.js
}, 60 * 60 * 1000);