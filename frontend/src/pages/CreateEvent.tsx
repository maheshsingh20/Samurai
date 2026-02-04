import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Shuffle } from 'lucide-react';
import { eventApi } from '../services/api';
import { dynamicApi, DynamicUser, DynamicContent } from '../services/dynamicApi';
import { CreateEventRequest } from '../types';

const CreateEvent: React.FC = () => {
  const [formData, setFormData] = useState<CreateEventRequest>({
    actor_id: localStorage.getItem('user_id') || 'user_1',
    verb: 'like',
    object_type: 'post',
    object_id: '',
    target_user_ids: [],
    actor_name: '',
    object_title: ''
  });

  const [targetUserInput, setTargetUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dynamicUsers, setDynamicUsers] = useState<DynamicUser[]>([]);
  const [dynamicContent, setDynamicContent] = useState<DynamicContent | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const verbs = [
    { value: 'like', label: '❤️ Like', description: 'User liked something', color: 'text-red-600' },
    { value: 'comment', label: '💬 Comment', description: 'User commented on something', color: 'text-blue-600' },
    { value: 'share', label: '🔄 Share', description: 'User shared something', color: 'text-green-600' },
    { value: 'follow', label: '👥 Follow', description: 'User followed someone', color: 'text-purple-600' },
    { value: 'purchase', label: '🛒 Purchase', description: 'User purchased something', color: 'text-yellow-600' },
    { value: 'view', label: '👀 View', description: 'User viewed something', color: 'text-gray-600' },
    { value: 'bookmark', label: '🔖 Bookmark', description: 'User bookmarked something', color: 'text-pink-600' }
  ];

  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const [users, content] = await Promise.all([
          dynamicApi.getUsers(),
          dynamicApi.getContent()
        ]);

        setDynamicUsers(users);
        setDynamicContent(content);

        // Set default actor to current user or first available user
        const currentUser = users.find(u => u.id === localStorage.getItem('user_id')) || users[0];
        if (currentUser) {
          setFormData(prev => ({
            ...prev,
            actor_id: currentUser.id,
            actor_name: currentUser.name
          }));
        }
      } catch (error) {
        console.error('Error loading dynamic data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadDynamicData();
  }, []);

  const getAllContent = () => {
    if (!dynamicContent) return [];
    return [
      ...dynamicContent.posts.map(p => ({ ...p, category: 'Posts' })),
      ...dynamicContent.photos.map(p => ({ ...p, category: 'Photos' })),
      ...dynamicContent.videos.map(v => ({ ...v, category: 'Videos' })),
      ...dynamicContent.articles.map(a => ({ ...a, category: 'Articles' })),
      ...dynamicContent.products.map(p => ({ ...p, category: 'Products' })),
      ...dynamicContent.projects.map(p => ({ ...p, category: 'Projects' }))
    ];
  };

  const handleInputChange = (field: keyof CreateEventRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleTargetUsersChange = (value: string) => {
    setTargetUserInput(value);
    const userIds = value.split(',').map(u => u.trim()).filter(u => u.length > 0);
    setFormData(prev => ({ ...prev, target_user_ids: userIds }));
  };

  const generateRealisticEvent = () => {
    if (!dynamicUsers.length || !dynamicContent) return;

    const actor = dynamicUsers[Math.floor(Math.random() * dynamicUsers.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const allContent = getAllContent();
    const content = allContent[Math.floor(Math.random() * allContent.length)];

    // Generate realistic target users
    const targetUsers = dynamicUsers
      .filter(u => u.id !== actor.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 1)
      .map(u => u.id);

    setFormData({
      actor_id: actor.id,
      actor_name: actor.name,
      verb: verb.value,
      object_type: content.type,
      object_id: content.id,
      object_title: content.title,
      target_user_ids: targetUsers
    });

    setTargetUserInput(targetUsers.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.object_id.trim()) {
        throw new Error('Object ID is required');
      }

      const response = await eventApi.create({
        ...formData,
        object_id: formData.object_id.trim(),
        actor_name: formData.actor_name.trim() || undefined,
        object_title: formData.object_title.trim() || undefined
      });

      setSuccess(`🎉 Event created successfully! ID: ${response.event_id}`);

      // Clear form after success
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3">Loading dynamic data from external APIs...</span>
        </div>
      </div>
    );
  }

  const currentUser = dynamicUsers.find(u => u.id === formData.actor_id);
  const selectedVerb = verbs.find(v => v.value === formData.verb);
  const allContent = getAllContent();
  const selectedContent = allContent.find(c => c.id === formData.object_id);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🎯 Create User-Driven Event</h1>
        <p className="mt-2 text-gray-600">
          Create events using real dynamic data from external APIs - events only created when users take action
        </p>
      </div>

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Actor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Actor (Who is performing the action?)
                  </label>
                  <select
                    value={formData.actor_id}
                    onChange={(e) => {
                      const selectedUser = dynamicUsers.find(u => u.id === e.target.value);
                      handleInputChange('actor_id', e.target.value);
                      handleInputChange('actor_name', selectedUser?.name || '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {dynamicUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.avatar} {user.name} ({user.company || user.email}) {user.isOnline ? '🟢' : '🔴'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚡ Action (What are they doing?)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {verbs.map(verb => (
                      <label key={verb.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="verb"
                          value={verb.value}
                          checked={formData.verb === verb.value}
                          onChange={(e) => handleInputChange('verb', e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className={`font-medium ${verb.color}`}>{verb.label}</div>
                          <div className="text-xs text-gray-500">{verb.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Content Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📦 Select Content (From External APIs)
                  </label>
                  <select
                    value={formData.object_id}
                    onChange={(e) => {
                      const content = allContent.find(c => c.id === e.target.value);
                      if (content) {
                        handleInputChange('object_id', content.id);
                        handleInputChange('object_type', content.type);
                        handleInputChange('object_title', content.title);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select content from external APIs...</option>
                    {allContent.slice(0, 50).map(content => (
                      <option key={content.id} value={content.id}>
                        {content.category} - {content.title.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Target Users (Who will be notified?)
                  </label>
                  <input
                    type="text"
                    value={targetUserInput}
                    onChange={(e) => handleTargetUsersChange(e.target.value)}
                    placeholder="user_1, user_2, user_3..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dynamicUsers.filter(u => u.id !== formData.actor_id).slice(0, 10).map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          const currentTargets = formData.target_user_ids;
                          const newTargets = currentTargets.includes(user.id)
                            ? currentTargets.filter(id => id !== user.id)
                            : [...currentTargets, user.id];
                          setFormData(prev => ({ ...prev, target_user_ids: newTargets }));
                          setTargetUserInput(newTargets.join(', '));
                        }}
                        className={`text-xs px-2 py-1 rounded ${formData.target_user_ids.includes(user.id)
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                      >
                        {user.avatar} {user.name.split(' ')[0]} {user.isOnline ? '🟢' : '🔴'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                {success && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700">{success}</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={generateRealisticEvent}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate from APIs
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? (
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
              </form>
            </div>
          </div>

          {/* Preview & Info */}
          <div className="space-y-6">
            {/* Event Preview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Event Preview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-16">Actor:</span>
                  <span>{currentUser?.avatar} {formData.actor_name || formData.actor_id}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-16">Action:</span>
                  <span className={selectedVerb?.color}>{selectedVerb?.label}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-16">Content:</span>
                  <span>{selectedContent?.category} "{formData.object_title}"</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-600 w-16">Targets:</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.target_user_ids.map(userId => {
                      const user = dynamicUsers.find(u => u.id === userId);
                      return user ? (
                        <span key={userId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.avatar} {user.name.split(' ')[0]}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Data Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🌐 Live External Data</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <span className="font-medium text-blue-600">{dynamicUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online Users:</span>
                  <span className="font-medium text-green-600">{dynamicUsers.filter(u => u.isOnline).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Content:</span>
                  <span className="font-medium text-purple-600">{getAllContent().length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span className="font-medium">{dynamicContent?.posts.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Photos:</span>
                  <span className="font-medium">{dynamicContent?.photos.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Videos:</span>
                  <span className="font-medium">{dynamicContent?.videos.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 User-Driven Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All users loaded from JSONPlaceholder API</li>
                <li>• Content fetched from external sources</li>
                <li>• Real company names and user data</li>
                <li>• Events only created when users take action</li>
                <li>• No automatic generation - purely user-driven!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;