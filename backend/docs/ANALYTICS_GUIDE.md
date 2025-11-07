# Analytics System Guide

Comprehensive guide for the privacy-friendly analytics system in Multimedia Portal.

---

## Table of Contents

1. [Overview](#overview)
2. [Privacy-First Design](#privacy-first-design)
3. [Architecture](#architecture)
4. [Tracked Events](#tracked-events)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Dashboard Metrics](#dashboard-metrics)
8. [Data Retention](#data-retention)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Analytics system provides **privacy-friendly tracking** of user behavior without storing personal information. All analytics are anonymized and aggregated.

### Features

- ✅ **Privacy-First**: No cookies, no personal data, IP anonymization
- ✅ **GDPR Compliant**: No personally identifiable information stored
- ✅ **Real-Time**: Redis-based aggregation for instant insights
- ✅ **Lightweight**: Minimal performance impact
- ✅ **Comprehensive**: Page views, content views, searches, engagements
- ✅ **Admin Dashboard**: Beautiful visualizations for insights

### What We Track

- Page views and navigation paths
- Time spent on pages and content
- Popular content (articles, blog posts, etc.)
- Search queries and zero-result searches
- User engagements (comments, ratings, shares)
- Entry and exit pages

### What We DON'T Track

- ❌ Personal information (names, emails)
- ❌ Full IP addresses (anonymized)
- ❌ Cookies or persistent identifiers
- ❌ Cross-site tracking
- ❌ Device fingerprinting
- ❌ Individual user profiles

---

## Privacy-First Design

### Session Hashing

Instead of storing IP addresses, we create **anonymized session hashes**:

```
Session Hash = SHA256(
  Anonymized IP +
  User Agent +
  Current Date +
  Salt
)
```

**Example:**
- Real IP: `192.168.1.123` → Anonymized: `192.168.0.0`
- User Agent: `Mozilla/5.0 ...`
- Date: `2025-01-15`
- Salt: `secret-salt-string`
- **Result**: `a1b2c3d4e5f6g7h8` (16-char hash)

### Why This is Privacy-Friendly

1. **IP Anonymization**: Last 2 octets removed (IPv4) or trimmed (IPv6)
2. **No Reversibility**: Can't recover original IP from hash
3. **Time-Limited**: Hash changes daily
4. **No Cross-Site Tracking**: Hashes are site-specific
5. **No Personal Data**: Only aggregated statistics

### GDPR Compliance

- No personal data processed
- No consent required (anonymous analytics)
- Data retention limits (90 days default)
- Right to erasure not applicable (no personal data)
- No data subject identification possible

---

## Architecture

### Stack

- **Redis**: Fast in-memory data store for real-time aggregation
- **NestJS**: Backend service for tracking and queries
- **TypeScript**: Type-safe implementation

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                          │
│                                                          │
│  User Action → Track Event → POST /api/v1/analytics/... │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (NestJS)                            │
│                                                          │
│  AnalyticsController                                     │
│  └─> AnalyticsService                                   │
│       ├─> Hash IP + User Agent                          │
│       ├─> Generate Session ID                           │
│       └─> Store in Redis                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              REDIS (In-Memory DB)                        │
│                                                          │
│  analytics:daily:2025-01-15 (daily stats)               │
│  analytics:paths:2025-01-15 (popular paths)             │
│  analytics:content:all-time (popular content)           │
│  analytics:searches:2025-01-15 (search queries)         │
│  analytics:sessions:2025-01-15 (unique sessions)        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD                             │
│                                                          │
│  GET /api/v1/analytics/dashboard → Charts & Metrics     │
│  GET /api/v1/analytics/popular → Top Content            │
│  GET /api/v1/analytics/trends → Historical Data         │
└─────────────────────────────────────────────────────────┘
```

---

## Tracked Events

### 1. Page View

Track when a user views any page.

**Frontend Example:**
```typescript
await fetch('/api/v1/analytics/track/page-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/articles/introduction-to-nestjs',
    referrer: document.referrer,
    duration: 45, // seconds spent on previous page
  }),
});
```

**What It Tracks:**
- Page path (e.g., `/articles/123`)
- Referrer domain (e.g., `google.com`)
- Time spent on page
- Session hash (anonymized)

### 2. Content View

Track when specific content is viewed.

**Frontend Example:**
```typescript
await fetch('/api/v1/analytics/track/content-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentType: 'article',
    contentId: 'article-123',
    duration: 120, // seconds viewing content
  }),
});
```

**What It Tracks:**
- Content type (article, blog_post, wiki_page, etc.)
- Content ID
- View duration
- Unique views per session

### 3. Search Query

Track search queries to understand user needs.

**Frontend Example:**
```typescript
await fetch('/api/v1/analytics/track/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'nestjs tutorial',
    resultsCount: 42,
  }),
});
```

**What It Tracks:**
- Search queries (normalized, lowercase)
- Number of results
- Zero-result searches (for content ideas)

### 4. Engagement

Track user engagements like comments, ratings, shares.

**Frontend Example:**
```typescript
await fetch('/api/v1/analytics/track/engagement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventName: 'comment',
    contentType: 'article',
    contentId: 'article-123',
  }),
});
```

**What It Tracks:**
- Engagement type (comment, rating, share, like, bookmark)
- Content being engaged with
- Total engagements per content

---

## API Endpoints

### Public Endpoints (No Authentication)

#### POST /api/v1/analytics/track/page-view
Track page view event.

**Request:**
```json
{
  "path": "/articles/my-article",
  "referrer": "https://google.com",
  "duration": 45
}
```

**Response:** `204 No Content`

#### POST /api/v1/analytics/track/content-view
Track content view event.

**Request:**
```json
{
  "contentType": "article",
  "contentId": "article-123",
  "duration": 120
}
```

**Response:** `204 No Content`

#### POST /api/v1/analytics/track/search
Track search query.

**Request:**
```json
{
  "query": "nestjs tutorial",
  "resultsCount": 42
}
```

**Response:** `204 No Content`

#### POST /api/v1/analytics/track/engagement
Track engagement event.

**Request:**
```json
{
  "eventName": "comment",
  "contentType": "article",
  "contentId": "article-123"
}
```

**Response:** `204 No Content`

### Admin Endpoints (Authentication Required)

#### GET /api/v1/analytics/dashboard
Get dashboard statistics.

**Authorization:** Admin or Moderator

**Response:**
```json
{
  "totalPageViews": 1234,
  "uniqueSessions": 567,
  "totalContentViews": 890,
  "averageDuration": 125,
  "pageViewsGrowth": 15.5,
  "sessionsGrowth": -5.2,
  "popularPaths": {
    "/articles": 123,
    "/blog": 89
  },
  "topSearches": {
    "nestjs": 45,
    "typescript": 32
  }
}
```

#### GET /api/v1/analytics/popular
Get popular content.

**Authorization:** Admin or Moderator

**Query Parameters:**
- `period`: `last_7_days`, `last_30_days`, `all_time` (default: `last_7_days`)
- `limit`: Number of items (default: 50, max: 100)

**Response:**
```json
{
  "items": [
    {
      "contentType": "article",
      "contentId": "article-123",
      "title": "Introduction to NestJS",
      "views": 456,
      "averageDuration": 180,
      "engagements": 34
    }
  ],
  "period": "last_7_days",
  "totalCount": 50
}
```

#### GET /api/v1/analytics/trends
Get analytics trends over time.

**Authorization:** Admin or Moderator

**Query Parameters:**
- `period`: `daily`, `weekly`, `monthly` (default: `daily`)
- `days`: Number of days (default: 30, max: 365)

**Response:**
```json
{
  "trends": [
    {
      "period": "daily",
      "label": "2025-01-15",
      "pageViews": 1234,
      "uniqueSessions": 567,
      "contentViews": 890,
      "averageDuration": 125
    }
  ],
  "period": "daily",
  "dataPoints": 30
}
```

---

## Frontend Integration

### React Hook Example

```typescript
// hooks/useAnalytics.ts
import { useEffect, useRef } from 'react';

export const usePageView = (path: string) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Track page view on mount
    fetch('/api/v1/analytics/track/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer: document.referrer,
      }),
    });

    // Track duration on unmount
    return () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      fetch('/api/v1/analytics/track/page-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, duration }),
      });
    };
  }, [path]);
};

export const useContentView = (contentType: string, contentId: string) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    fetch('/api/v1/analytics/track/content-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, contentId }),
    });

    return () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      fetch('/api/v1/analytics/track/content-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, duration }),
      });
    };
  }, [contentType, contentId]);
};

export const trackSearch = (query: string, resultsCount: number) => {
  fetch('/api/v1/analytics/track/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, resultsCount }),
  });
};

export const trackEngagement = (
  eventName: string,
  contentType: string,
  contentId: string,
) => {
  fetch('/api/v1/analytics/track/engagement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, contentType, contentId }),
  });
};
```

### Usage in Components

```typescript
// app/articles/[slug]/page.tsx
'use client';

import { usePageView, useContentView, trackEngagement } from '@/hooks/useAnalytics';

export default function ArticlePage({ article }) {
  usePageView(`/articles/${article.slug}`);
  useContentView('article', article.id);

  const handleComment = async () => {
    // ... save comment
    trackEngagement('comment', 'article', article.id);
  };

  const handleRating = async (rating: number) => {
    // ... save rating
    trackEngagement('rating', 'article', article.id);
  };

  return (
    <div>
      {/* Article content */}
    </div>
  );
}
```

---

## Dashboard Metrics

### Key Performance Indicators (KPIs)

1. **Total Page Views**: Number of pages viewed today
2. **Unique Sessions**: Number of unique visitors today
3. **Total Content Views**: Number of content items viewed today
4. **Average Duration**: Average time spent per page (seconds)
5. **Growth Rates**: Day-over-day percentage changes

### Popular Paths

Shows which pages are most visited:

```
/articles            123 views
/blog                 89 views
/wiki                 67 views
/stories              45 views
/gallery              32 views
```

### Top Searches

Shows what users are searching for:

```
nestjs               45 searches
typescript           32 searches
react                28 searches
authentication       23 searches
```

### Popular Content

Shows most viewed content items with engagement metrics:

```
Title                        Views    Avg Duration    Engagements
--------------------------------------------------------------------
Introduction to NestJS        456       180s            34
TypeScript Best Practices     342       210s            28
React Hooks Guide             289       165s            22
```

### Trends

Historical data showing:
- Page views over time
- Unique sessions over time
- Content views over time
- Average duration trends

---

## Data Retention

### Default Retention: 90 Days

Analytics data is automatically cleaned up after the retention period.

### Cleanup Schedule

Run cleanup periodically (daily recommended):

```typescript
import { AnalyticsService } from './analytics.service';

// In your cron job or scheduled task
await analyticsService.cleanupOldData(90); // Keep last 90 days
```

### Manual Cleanup

```bash
# Via API (Admin only)
curl -X POST http://localhost:4000/api/v1/analytics/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"daysToKeep": 90}'
```

### What Gets Deleted

- Daily statistics older than retention period
- Session hashes older than 24 hours
- Individual event data (aggregated data retained)

### What's Retained

- Aggregated all-time statistics (popular content)
- Summary metrics (not tied to dates)

---

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Analytics-specific Redis DB (0-15)
REDIS_ANALYTICS_DB=2

# Privacy salt for session hashing
ANALYTICS_SALT=your-long-random-secret-change-in-production

# Data retention (days)
ANALYTICS_RETENTION_DAYS=90
```

### Production Recommendations

1. **Use strong salt**: `openssl rand -base64 32`
2. **Separate Redis DB**: Don't mix with cache (use DB 2+)
3. **Enable Redis persistence**: Configure RDB or AOF
4. **Set up cleanup cron**: Daily cleanup recommended
5. **Monitor Redis memory**: Set maxmemory policy

---

## Troubleshooting

### Analytics Not Recording

**Check:**
1. Redis is running: `redis-cli ping` → `PONG`
2. Environment variables are set
3. AnalyticsModule is imported in app.module.ts
4. Check logs for errors

### Dashboard Shows No Data

**Check:**
1. Data has been tracked (send test events)
2. Redis keys exist: `redis-cli KEYS "analytics:*"`
3. Date keys are correct (UTC vs local time)
4. Authentication is working (admin/moderator role)

### High Redis Memory Usage

**Solutions:**
1. Reduce retention days: `ANALYTICS_RETENTION_DAYS=30`
2. Run cleanup more frequently
3. Set Redis maxmemory: `maxmemory 256mb`
4. Use Redis eviction policy: `maxmemory-policy allkeys-lru`

### Slow Performance

**Solutions:**
1. Use Redis pipelining (already implemented)
2. Add Redis indexes for frequently queried keys
3. Limit popular content query size
4. Cache dashboard results (5-minute TTL)

---

## Best Practices

1. **Track Selectively**: Don't track every tiny interaction
2. **Batch Requests**: Combine multiple track calls when possible
3. **Handle Failures Gracefully**: Analytics shouldn't break user experience
4. **Monitor Redis**: Set up alerts for high memory usage
5. **Regular Cleanup**: Schedule daily cleanup jobs
6. **Privacy Audit**: Review what you're tracking regularly
7. **Document Changes**: Update this guide when adding new metrics

---

## Related Documentation

- [Security Configuration](./SECURITY_CONFIGURATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [GDPR Compliance](./GDPR_COMPLIANCE.md)

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Backend Team
