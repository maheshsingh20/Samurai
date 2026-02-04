import React from 'react';
import { X, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, markAsRead, clearAll } = useNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead([notificationId]);
  };

  const getVerbColor = (verb: string) => {
    const colors: Record<string, string> = {
      like: 'text-red-600 bg-red-50',
      comment: 'text-blue-600 bg-blue-50',
      follow: 'text-green-600 bg-green-50',
      share: 'text-purple-600 bg-purple-50',
      purchase: 'text-yellow-600 bg-yellow-50',
      default: 'text-gray-600 bg-gray-50'
    };
    return colors[verb] || colors.default;
  };

  const formatNotificationText = (notification: any) => {
    const actor = notification.actor_name || notification.actor_id;
    const object = notification.object_title || notification.object_id;

    switch (notification.verb) {
      case 'like':
        return `${actor} liked your ${notification.object_type} "${object}"`;
      case 'comment':
        return `${actor} commented on your ${notification.object_type} "${object}"`;
      case 'follow':
        return `${actor} started following you`;
      case 'share':
        return `${actor} shared your ${notification.object_type} "${object}"`;
      case 'purchase':
        return `${actor} purchased ${notification.object_type} "${object}"`;
      default:
        return `${actor} ${notification.verb} ${notification.object_type} "${object}"`;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={clearAll}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getVerbColor(notification.verb)}`}>
                    {notification.verb.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {formatNotificationText(notification)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="flex-shrink-0 text-primary-600 hover:text-primary-700"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <span className="text-xs text-gray-500">
            Showing {notifications.length} recent notifications
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;