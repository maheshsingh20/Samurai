export class AnalyticsService {
  constructor() {
    // Sliding window counters for different time windows
    this.windows = {
      '1m': { duration: 60 * 1000, buckets: new Map() },
      '5m': { duration: 5 * 60 * 1000, buckets: new Map() },
      '1h': { duration: 60 * 60 * 1000, buckets: new Map() }
    };

    // Cleanup old buckets every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  recordEvent(verb, objectId, objectType) {
    const now = Date.now();

    Object.entries(this.windows).forEach(([windowName, window]) => {
      const bucketKey = Math.floor(now / (window.duration / 60)); // 60 buckets per window

      if (!window.buckets.has(bucketKey)) {
        window.buckets.set(bucketKey, {
          timestamp: bucketKey * (window.duration / 60),
          verbs: new Map(),
          objects: new Map(),
          objectTypes: new Map()
        });
      }

      const bucket = window.buckets.get(bucketKey);

      // Count verbs
      bucket.verbs.set(verb, (bucket.verbs.get(verb) || 0) + 1);

      // Count object_ids
      bucket.objects.set(objectId, (bucket.objects.get(objectId) || 0) + 1);

      // Count object_types
      bucket.objectTypes.set(objectType, (bucket.objectTypes.get(objectType) || 0) + 1);
    });
  }

  getTopItems(windowName, type = 'objects', limit = 100) {
    const window = this.windows[windowName];
    if (!window) {
      throw new Error(`Invalid window: ${windowName}`);
    }

    const now = Date.now();
    const windowStart = now - window.duration;
    const aggregated = new Map();

    // Aggregate counts from all relevant buckets
    window.buckets.forEach((bucket, bucketKey) => {
      if (bucket.timestamp >= windowStart) {
        let sourceMap;
        switch (type) {
          case 'verbs':
            sourceMap = bucket.verbs;
            break;
          case 'objects':
            sourceMap = bucket.objects;
            break;
          case 'objectTypes':
            sourceMap = bucket.objectTypes;
            break;
          default:
            sourceMap = bucket.objects;
        }

        sourceMap.forEach((count, item) => {
          aggregated.set(item, (aggregated.get(item) || 0) + count);
        });
      }
    });

    // Sort by count and return top items
    return Array.from(aggregated.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }

  cleanup() {
    const now = Date.now();

    Object.values(this.windows).forEach(window => {
      const cutoff = now - window.duration * 2; // Keep 2x window duration for safety

      window.buckets.forEach((bucket, bucketKey) => {
        if (bucket.timestamp < cutoff) {
          window.buckets.delete(bucketKey);
        }
      });
    });
  }

  getStats() {
    const stats = {};

    Object.entries(this.windows).forEach(([windowName, window]) => {
      stats[windowName] = {
        buckets: window.buckets.size,
        total_events: Array.from(window.buckets.values()).reduce((sum, bucket) => {
          return sum + Array.from(bucket.verbs.values()).reduce((s, c) => s + c, 0);
        }, 0)
      };
    });

    return stats;
  }

  // Get real-time analytics for dashboard
  getRealTimeStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const recentBuckets = Array.from(this.windows['1m'].buckets.values())
      .filter(bucket => bucket.timestamp >= oneMinuteAgo);

    const totalEvents = recentBuckets.reduce((sum, bucket) => {
      return sum + Array.from(bucket.verbs.values()).reduce((s, c) => s + c, 0);
    }, 0);

    const topVerbs = new Map();
    const topObjects = new Map();

    recentBuckets.forEach(bucket => {
      bucket.verbs.forEach((count, verb) => {
        topVerbs.set(verb, (topVerbs.get(verb) || 0) + count);
      });
      bucket.objects.forEach((count, object) => {
        topObjects.set(object, (topObjects.get(object) || 0) + count);
      });
    });

    return {
      events_per_minute: totalEvents,
      top_verbs: Array.from(topVerbs.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([verb, count]) => ({ verb, count })),
      top_objects: Array.from(topObjects.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([object, count]) => ({ object, count })),
      timestamp: new Date().toISOString()
    };
  }
}