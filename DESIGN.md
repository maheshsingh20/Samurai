# Activity Feed + Notifications System Design

## Overview

This document outlines the design and architecture of a mini activity feed and notifications system similar to GitHub/LinkedIn, built with the MERN stack (MongoDB, Express, React, Node.js).

## System Requirements

### Functional Requirements
- **Event Ingestion**: Accept activity events via REST API
- **Feed Retrieval**: Provide paginated activity feeds (pull model)
- **Real-time Notifications**: Push notifications via WebSocket (push model)
- **Analytics**: Track and report top activities in time windows
- **Performance**: Handle 2,000 concurrent connections and 200M+ events

### Non-Functional Requirements
- **Scalability**: Support 10x traffic and event growth
- **Performance**: P95 feed response < 100ms even with large history
- **Reliability**: At-least-once delivery with idempotency considerations
- **Availability**: Graceful degradation during failures

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Load Balancer  │    │   Node.js API   │
│   (Frontend)    │◄──►│   (Optional)    │◄──►│    Server       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │    MongoDB      │
                                               │   (Database)    │
                                               └─────────────────┘
```

### Component Architecture

#### 1. API Layer (Express.js)
- **Event Ingestion**: `/api/events` - POST endpoint for creating events
- **Feed Retrieval**: `/api/feed` - GET endpoint with cursor-based pagination
- **Notifications**: `/api/notifications` - GET endpoint for polling fallback
- **Analytics**: `/api/top` - GET endpoint for windowed analytics
- **WebSocket Server**: Real-time notification delivery

#### 2. Data Layer (MongoDB)
- **Events Collection**: Primary storage for all activity events
- **Indexes**: Optimized for common query patterns
- **TTL**: Optional automatic cleanup of old events

#### 3. Caching Layer (In-Memory)
- **Feed Cache**: Hot feeds cached for 2-5 minutes
- **Analytics Cache**: Sliding window counters for real-time analytics
- **Notification Buffer**: Recent notifications for reconnection scenarios

#### 4. Real-time Layer (WebSocket)
- **Connection Management**: Track active user connections
- **Message Broadcasting**: Push notifications to connected users
- **Reconnection Handling**: Graceful reconnection with pending message delivery

## Data Models

### Event Schema
```javascript
{
  event_id: String (UUID),
  actor_id: String (indexed),
  verb: String (indexed),
  object_type: String (indexed),
  object_id: String (indexed),
  target_user_ids: [String] (indexed),
  created_at: Date (indexed),
  // Denormalized fields for performance
  actor_name: String,
  object_title: String
}
```

### Database Indexes
```javascript
// Compound indexes for efficient queries
{ target_user_ids: 1, created_at: -1 }  // Feed queries
{ actor_id: 1, created_at: -1 }          // User activity
{ object_type: 1, object_id: 1, created_at: -1 }  // Object activity
{ verb: 1, created_at: -1 }              // Analytics
{ created_at: 1 }                        // TTL index (optional)
```

## Fanout Strategy

### Hybrid Approach (Fanout-on-Read with Caching)

**Rationale**: Given the read-heavy nature and requirement for 200M+ events, fanout-on-read is more storage-efficient than fanout-on-write.

**Implementation**:
1. **Event Storage**: Store events in a single collection with proper indexing
2. **Query Optimization**: Use compound indexes for efficient feed queries
3. **Caching**: Cache hot feeds and use cursor-based pagination
4. **Real-time Push**: Use WebSocket for immediate notification delivery

**Trade-offs**:
- ✅ Storage efficient (no duplication)
- ✅ Consistent view across all users
- ✅ Easy to implement complex filtering
- ❌ Higher read latency for large feeds
- ❌ More complex caching strategy needed

## Caching Strategy

### 1. Feed Caching
- **Cache Key**: `feed:{user_id}:{cursor}:{limit}:{include_own}`
- **TTL**: 2-5 minutes (balance between freshness and performance)
- **Invalidation**: Time-based expiration (eventual consistency acceptable)

### 2. Analytics Caching
- **Sliding Window Counters**: In-memory buckets for different time windows
- **Bucket Strategy**: 60 buckets per window for granular tracking
- **Cleanup**: Periodic cleanup of old buckets

### 3. Notification Caching
- **Recent Notifications**: Keep last 1000 notifications per user in memory
- **Reconnection Buffer**: Deliver pending notifications on WebSocket reconnect
- **Cleanup**: Remove notifications older than 24 hours

## Pagination Strategy

### Cursor-Based Pagination
```javascript
// Request
GET /api/feed?user_id=123&cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMFoifQ&limit=20

// Response
{
  items: [...],
  next_cursor: "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMTowMDowMFoifQ",
  has_more: true
}
```

**Benefits**:
- Stable pagination (no duplicate/missing items)
- Efficient for large datasets
- Works well with time-ordered data

## Real-time Notifications

### WebSocket Implementation
```javascript
// Connection
ws://localhost:3001/notifications?user_id=123

// Message Format
{
  type: "notification",
  data: {
    event_id: "...",
    actor_id: "...",
    verb: "like",
    object_type: "post",
    created_at: "...",
    // ... other fields
  },
  timestamp: "2024-01-01T00:00:00Z"
}
```

### Connection Management
- **User Mapping**: Map user_id to WebSocket connections
- **Multi-Connection**: Support multiple connections per user
- **Heartbeat**: Periodic ping/pong for connection health
- **Reconnection**: Exponential backoff with pending message delivery

## Analytics Implementation

### Sliding Window Counters
```javascript
// Window structure
{
  '1m': { duration: 60000, buckets: Map() },
  '5m': { duration: 300000, buckets: Map() },
  '1h': { duration: 3600000, buckets: Map() }
}

// Bucket structure
{
  timestamp: 1640995200000,
  verbs: Map('like' => 150, 'comment' => 75),
  objects: Map('post_123' => 50, 'photo_456' => 30),
  objectTypes: Map('post' => 200, 'photo' => 100)
}
```

### Real-time Updates
- **Event Recording**: Update counters on each event ingestion
- **Bucket Management**: Create new buckets as time progresses
- **Cleanup**: Remove old buckets beyond window duration
- **Aggregation**: Sum counts across relevant buckets for queries

## Scaling Strategy

### 10x Traffic Growth (20,000 concurrent connections)

1. **Horizontal Scaling**
   - Multiple Node.js instances behind load balancer
   - WebSocket sticky sessions or Redis pub/sub
   - MongoDB replica set for read scaling

2. **Caching Improvements**
   - Redis cluster for distributed caching
   - CDN for static assets
   - Database query result caching

3. **Database Optimization**
   - Read replicas for feed queries
   - Sharding by user_id or time ranges
   - Separate analytics database

### 10x Event Growth (2B+ events)

1. **Data Partitioning**
   - Time-based sharding (monthly collections)
   - User-based sharding for feeds
   - Separate hot/cold storage

2. **Event Processing**
   - Message queue for event ingestion (Redis/RabbitMQ)
   - Batch processing for analytics
   - Event sourcing patterns

3. **Storage Optimization**
   - Compression for old events
   - Archival to cold storage
   - Selective indexing

## Failure Modes & Mitigation

### 1. Dropped Events
**Causes**: Network failures, server overload, database unavailability
**Mitigation**:
- Message queues with persistence
- Retry mechanisms with exponential backoff
- Dead letter queues for failed events
- Idempotency keys for duplicate prevention

### 2. Reconnection Storms
**Causes**: Server restart, network issues affecting many users
**Mitigation**:
- Exponential backoff with jitter
- Connection rate limiting
- Graceful degradation to polling
- Circuit breaker patterns

### 3. Database Backpressure
**Causes**: High write load, slow queries, index contention
**Mitigation**:
- Write buffering and batching
- Read replicas for query distribution
- Query optimization and monitoring
- Graceful degradation (serve cached data)

### 4. Memory Pressure
**Causes**: Large notification buffers, analytics counters, connection state
**Mitigation**:
- LRU eviction policies
- Configurable buffer sizes
- Memory monitoring and alerts
- Horizontal scaling

## Performance Targets

### Response Time Targets
- **Event Ingestion**: < 50ms P95
- **Feed Retrieval**: < 100ms P95 (even with 900k events)
- **Real-time Notifications**: < 10ms delivery
- **Analytics Queries**: < 200ms P95

### Throughput Targets
- **Event Ingestion**: 10,000+ events/second
- **Feed Queries**: 5,000+ queries/second
- **Concurrent Connections**: 2,000+ WebSocket connections
- **Analytics Updates**: Real-time (< 1 second lag)

## Monitoring & Observability

### Key Metrics
- **Application**: Request rate, response time, error rate
- **Database**: Query performance, connection pool, index usage
- **WebSocket**: Connection count, message rate, reconnection rate
- **System**: CPU, memory, disk I/O, network

### Alerting
- High error rates (> 1%)
- Slow response times (P95 > targets)
- Database connection exhaustion
- Memory usage > 80%
- WebSocket connection drops

## Security Considerations

### Authentication & Authorization
- Mock authentication via user_id header (development)
- JWT tokens for production
- Rate limiting per user
- Input validation and sanitization

### Data Protection
- HTTPS/WSS for encrypted communication
- Input validation to prevent injection
- Audit logging for sensitive operations
- Data retention policies

## Deployment Strategy

### Development
```bash
# Start MongoDB
mongod --dbpath ./data

# Start backend
npm run server

# Start frontend
npm run client
```

### Production Considerations
- Container orchestration (Docker + Kubernetes)
- Environment-specific configurations
- Database migrations and backups
- Load balancer configuration
- SSL certificate management
- Monitoring and logging setup

## Conclusion

This design provides a scalable, performant activity feed and notifications system that can handle the specified requirements while maintaining good user experience. The hybrid fanout approach balances storage efficiency with query performance, while the caching strategy ensures fast response times even under high load.

The system is designed to gracefully handle failures and scale horizontally as traffic grows, making it suitable for production deployment with proper monitoring and operational practices.