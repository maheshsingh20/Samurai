import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, User, Heart, MessageCircle, Share, ShoppingCart, Activity } from 'lucide-react';
import { feedApi } from '../services/api';
import { Event, FeedResponse } from '../types';

const Feed: React.FC = () => {
  const [feed, setFeed] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [includeOwn, setIncludeOwn] = useState(true);

  const userId = localStorage.getItem('user_id') || 'user_1';

  const loadFeed = useCallback(async (cursor?: string, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setFeed([]);
      } else if (cursor) {
        setLoadingMore(true);
      }

      const response: FeedResponse = await feedApi.getFeed({
        user_id: userId,
        cursor,
        limit: 20,
        include_own: includeOwn
      });

      if (reset) {
        setFeed(response.items);
      } else {
        setFeed(prev => [...prev, ...response.items]);
      }

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, includeOwn]);

  useEffect(() => {
    loadFeed(undefined, true);

    // Auto-refresh feed every 10 seconds for dynamic updates
    const refreshInterval = setInterval(() => {
      loadFeed(undefined, true);
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [loadFeed]);

  const handleRefresh = () => {
    loadFeed(undefined, true);
  };

  const handleLoadMore = () => {
    if (nextCursor && hasMore && !loadingMore) {
      loadFeed(nextCursor);
    }
  };

  const getVerbIcon = (verb: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      like: Heart,
      comment: MessageCircle,
      share: Share,
      purchase: ShoppingCart,
      follow: User
    };
    return icons[verb] || User;
  };

  const getVerbColor = (verb: string) => {
    const colors: Record<string, string> = {
      like: 'text-red-500',
      comment: 'text-blue-500',
      share: 'text-green-500',
      purchase: 'text-yellow-500',
      follow: 'text-purple-500'
    };
    return colors[verb] || 'text-gray-500';
  };

  const formatEventText = (event: Event) => {
    const actor = event.actor_name || event.actor_id;
    const object = event.object_title || event.object_id;

    switch (event.verb) {
      case 'like':
        return `${actor} liked ${event.object_type} "${object}"`;
      case 'comment':
        return `${actor} commented on ${event.object_type} "${object}"`;
      case 'follow':
        return `${actor} started following ${object}`;
      case 'share':
        return `${actor} shared ${event.object_type} "${object}"`;
      case 'purchase':
        return `${actor} purchased ${event.object_type} "${object}"`;
      default:
        return `${actor} ${event.verb} ${event.object_type} "${object}"`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔥 Live Activity Feed</h1>
          <p className="mt-2 text-gray-600 flex items-center">
            Latest activities from your network
            <span className="ml-2 flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Auto-refreshing
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeOwn}
              onChange={(e) => setIncludeOwn(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Include my activities</span>
          </label>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Feed Items */}
      <div className="bg-white shadow rounded-lg">
        {feed.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities to show</p>
            <p className="text-sm mt-2">Activities will appear here as they happen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feed.map((event) => {
              const VerbIcon = getVerbIcon(event.verb);
              return (
                <div key={event.event_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${getVerbColor(event.verb)}`}>
                      <VerbIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-900">
                          {formatEventText(event)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Actor: {event.actor_id}</span>
                        <span>•</span>
                        <span>Type: {event.object_type}</span>
                        {event.target_user_ids.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Targets: {event.target_user_ids.length}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && feed.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Feed Stats */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Showing {feed.length} activities
        {hasMore && ' • More available'}
      </div>
    </div>
  );
};

export default Feed;