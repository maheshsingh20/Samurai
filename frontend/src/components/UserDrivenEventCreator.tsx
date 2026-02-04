import React, { useState, useEffect } from 'react';
import { Send, Users, TrendingUp, Zap } from 'lucide-react';
import { dynamicApi, DynamicUser, DynamicContent } from '../services/dynamicApi';
import { eventApi } from '../services/api';

interface UserDrivenEventCreatorProps {
  onEventCreated?: (event: any) => void;
}

const UserDrivenEventCreator: React.FC<UserDrivenEventCreatorProps> = ({ onEventCreated }) => {
  const [users, setUsers] = useState<DynamicUser[]>([]);
  const [content, setContent] = useState<DynamicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('like');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [lastCreatedEvent, setLastCreatedEvent] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const actions = [
    { value: 'like', label: '❤️ Like', color: 'text-red-600' },
    { value: 'comment', label: '💬 Comment', color: 'text-blue-600' },
    { value: 'share', label: '🔄 Share', color: 'text-green-600' },
    { value: 'follow', label: '👥 Follow', color: 'text-purple-600' },
    { value: 'view', label: '👀 View', color: 'text-gray-600' },
    { value: 'bookmark', label: '🔖 Bookmark', color: 'text-pink-600' }
  ];

  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const [dynamicUsers, dynamicContent] = await Promise.all([
          dynamicApi.getUsers(),
          dynamicApi.getContent()
        ]);

        setUsers(dynamicUsers);
        setContent(dynamicContent);

        // Set default selections
        if (dynamicUsers.length > 0) {
          const currentUserId = localStorage.getItem('user_id');
          const currentUser = dynamicUsers.find(u => u.id === currentUserId);
          setSelectedUser(currentUser ? currentUser.id : dynamicUsers[0].id);
        }
      } catch (error) {
        console.error('Error loading dynamic data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDynamicData();
  }, []);

  const getAllContent = () => {
    if (!content) return [];
    return [
      ...content.posts,
      ...content.photos,
      ...content.videos,
      ...content.articles,
      ...content.products,
      ...content.projects
    ];
  };

  const handleCreateEvent = async () => {
    if (!selectedUser || !selectedContent) {
      console.error('Missing required fields:', { selectedUser, selectedContent });
      return;
    }

    setCreating(true);
    try {
      const actor = users.find(u => u.id === selectedUser);
      const eventData = {
        actor_id: selectedUser,
        actor_name: actor?.name,
        verb: selectedAction,
        object_type: selectedContent.type,
        object_id: selectedContent.id,
        object_title: selectedContent.title,
        target_user_ids: targetUsers
      };

      console.log('Creating event with data:', eventData);
      const result = await eventApi.create(eventData);
      console.log('Event created successfully:', result);

      setLastCreatedEvent(eventData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      onEventCreated?.(eventData);

      // Reset form
      setSelectedContent(null);
      setTargetUsers([]);

    } catch (error) {
      console.error('Error creating event:', error);
      // Show user-friendly error message
      alert(`Failed to create event: ${error.response?.data?.error || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!selectedUser) {
      console.error('No user selected for quick action');
      return;
    }

    const allContent = getAllContent();
    if (allContent.length === 0) {
      console.error('No content available for quick action');
      alert('No content available. Please wait for content to load.');
      return;
    }

    const randomContent = allContent[Math.floor(Math.random() * allContent.length)];
    const actor = users.find(u => u.id === selectedUser);

    // Select random target users (excluding actor)
    const availableTargets = users.filter(u => u.id !== selectedUser);
    const randomTargets = availableTargets
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(u => u.id);

    setCreating(true);
    try {
      const eventData = {
        actor_id: selectedUser,
        actor_name: actor?.name,
        verb: action,
        object_type: randomContent.type,
        object_id: randomContent.id,
        object_title: randomContent.title,
        target_user_ids: randomTargets
      };

      console.log('Creating quick event with data:', eventData);
      const result = await eventApi.create(eventData);
      console.log('Quick event created successfully:', result);

      setLastCreatedEvent(eventData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      onEventCreated?.(eventData);

    } catch (error) {
      console.error('Error creating quick event:', error);
      alert(`Failed to create event: ${error.response?.data?.error || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const allContent = getAllContent();
  const onlineUsers = users.filter(u => u.isOnline);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎯 User-Driven Event Creator
        </h3>
        <p className="text-sm text-gray-600">
          Create events only when users perform real actions - no automatic generation
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && lastCreatedEvent && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">Event Created Successfully!</h4>
              <p className="text-sm text-green-700 mt-1">
                {lastCreatedEvent.actor_name} {lastCreatedEvent.verb} {lastCreatedEvent.object_type} "{lastCreatedEvent.object_title}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          👤 Select User (Actor)
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.avatar} {user.name} {user.isOnline ? '🟢' : '🔴'} ({user.company || 'No company'})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ⚡ Quick Actions (Random Content)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.slice(0, 6).map(action => (
            <button
              key={action.value}
              onClick={() => handleQuickAction(action.value)}
              disabled={creating || !selectedUser}
              className={`p-4 border-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${creating ? 'border-gray-200' : 'border-gray-300 hover:border-blue-300'
                } ${action.color}`}
            >
              <div className="text-sm font-medium">{action.label}</div>
              {creating && (
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mx-auto"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Event Creation */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Manual Event Creation</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {actions.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <select
              value={selectedContent?.id || ''}
              onChange={(e) => {
                const content = allContent.find(c => c.id === e.target.value);
                setSelectedContent(content);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select content...</option>
              {allContent.slice(0, 20).map(item => (
                <option key={item.id} value={item.id}>
                  {item.type}: {item.title.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Users</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {users.filter(u => u.id !== selectedUser).slice(0, 10).map(user => (
              <button
                key={user.id}
                onClick={() => {
                  setTargetUsers(prev =>
                    prev.includes(user.id)
                      ? prev.filter(id => id !== user.id)
                      : [...prev, user.id]
                  );
                }}
                className={`text-xs px-2 py-1 rounded ${targetUsers.includes(user.id)
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                {user.avatar} {user.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateEvent}
          disabled={creating || !selectedUser || !selectedContent}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Create Event
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{users.length}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{onlineUsers.length}</div>
            <div className="text-xs text-gray-500">Online Now</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{allContent.length}</div>
            <div className="text-xs text-gray-500">Content Items</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDrivenEventCreator;