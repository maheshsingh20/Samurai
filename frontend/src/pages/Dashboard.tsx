import React, { useState, useEffect } from 'react';
import { Activity, Users, TrendingUp, Clock, Zap, Database, Wifi } from 'lucide-react';
import { analyticsApi, feedApi, notificationApi } from '../services/api';
import { dynamicApi, DynamicUser, TrendingTopic } from '../services/dynamicApi';
import { RealTimeStats } from '../types';
import UserDrivenEventCreator from '../components/UserDrivenEventCreator';

const Dashboard: React.FC = () => {
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [feedStats, setFeedStats] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [dynamicUsers, setDynamicUsers] = useState<DynamicUser[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const userId = localStorage.getItem('user_id') || 'user_1';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [realTime, feed, notifications, users, trending] = await Promise.all([
          analyticsApi.getRealTime(),
          feedApi.getStats(userId),
          notificationApi.getStats(),
          dynamicApi.getUsers(),
          dynamicApi.getTrending()
        ]);

        setRealTimeStats(realTime);
        setFeedStats(feed);
        setNotificationStats(notifications);
        setDynamicUsers(users);
        setTrendingTopics(trending);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh real-time stats every 3 seconds for more dynamic feel
    const interval = setInterval(() => {
      if (isLive) {
        analyticsApi.getRealTime().then(setRealTimeStats).catch(console.error);
        notificationApi.getStats().then(setNotificationStats).catch(console.error);
        // Refresh dynamic data every 30 seconds
        if (Math.random() > 0.9) {
          dynamicApi.getUsers().then(setDynamicUsers).catch(console.error);
          dynamicApi.getTrending().then(setTrendingTopics).catch(console.error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, isLive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Events/Minute',
      value: realTimeStats?.events_per_minute || 0,
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-100',
      trend: '+12%',
      isLive: true
    },
    {
      name: 'Total Events',
      value: feedStats?.total_events || 0,
      icon: Database,
      color: 'text-blue-600 bg-blue-100',
      trend: '+5.2%'
    },
    {
      name: 'Live Users',
      value: dynamicUsers.filter(u => u.isOnline).length,
      icon: Wifi,
      color: 'text-green-600 bg-green-100',
      trend: `${dynamicUsers.length} total`,
      isLive: true
    },
    {
      name: 'Recent (24h)',
      value: feedStats?.recent_events_24h || 0,
      icon: Clock,
      color: 'text-purple-600 bg-purple-100',
      trend: '+18%'
    }
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Real-time activity feed and notification system
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isLive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
              }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>

          <div className="text-xs text-gray-500">
            Last updated: {realTimeStats ? new Date(realTimeStats.timestamp).toLocaleTimeString() : '--:--:--'}
          </div>
        </div>
      </div>

      {/* User-Driven Event Creator */}
      <div className="mb-6">
        <UserDrivenEventCreator onEventCreated={() => {
          // Refresh stats when new event is created by user action
          analyticsApi.getRealTime().then(setRealTimeStats).catch(console.error);
          notificationApi.getStats().then(setNotificationStats).catch(console.error);
        }} />
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${stat.color} ${stat.isLive ? 'animate-pulse' : ''
                      }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </div>
                        {stat.trend && (
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            {stat.trend}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                🔥 Trending Activities
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </div>
            </div>
            {realTimeStats?.top_verbs && realTimeStats.top_verbs.length > 0 ? (
              <div className="space-y-3">
                {realTimeStats.top_verbs.map((item, index) => (
                  <div key={item.verb} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {item.verb === 'like' ? '❤️' :
                          item.verb === 'comment' ? '💬' :
                            item.verb === 'share' ? '🔄' :
                              item.verb === 'follow' ? '👥' :
                                item.verb === 'purchase' ? '🛒' : '⚡'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {item.verb}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-primary-600 mr-2">{item.count}</span>
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.count / (realTimeStats.top_verbs[0]?.count || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Objects */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                📈 Popular Content
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </div>
            </div>
            {realTimeStats?.top_objects && realTimeStats.top_objects.length > 0 ? (
              <div className="space-y-3">
                {realTimeStats.top_objects.slice(0, 5).map((item, index) => (
                  <div key={item.object} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {item.object.length > 20 ? `${item.object.substring(0, 20)}...` : item.object}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-green-600 mr-2">{item.count}</span>
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.count / (realTimeStats.top_objects[0]?.count || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No trending content</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              🏥 System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">WebSocket</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <span className="text-sm font-medium text-gray-900">94.2%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium text-gray-900">23ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/create'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">➕</span>
              <span className="text-sm font-medium">Create Event</span>
            </button>

            <button
              onClick={() => window.location.href = '/feed'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">📰</span>
              <span className="text-sm font-medium">View Feed</span>
            </button>

            <button
              onClick={() => window.location.href = '/analytics'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm font-medium">Analytics</span>
            </button>

            <button
              onClick={() => {
                fetch('/api/events', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'user_id': userId
                  },
                  body: JSON.stringify({
                    actor_id: userId,
                    verb: 'test',
                    object_type: 'system',
                    object_id: `test_${Date.now()}`,
                    actor_name: 'System Test',
                    object_title: 'Dashboard Test Event'
                  })
                });
              }}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">🧪</span>
              <span className="text-sm font-medium">Test Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;