/**
 * Analytics Interfaces
 * Privacy-friendly analytics tracking for content and user behavior
 */

export enum EventType {
  PAGE_VIEW = 'PAGE_VIEW',
  CONTENT_VIEW = 'CONTENT_VIEW',
  COMMENT_POST = 'COMMENT_POST',
  RATING_POST = 'RATING_POST',
  SEARCH = 'SEARCH',
}

export enum ContentType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  WIKI_PAGE = 'WIKI_PAGE',
  GALLERY_ITEM = 'GALLERY_ITEM',
  STORY = 'STORY',
}

export interface AnalyticsEvent {
  type: EventType;
  contentType?: ContentType;
  contentId?: string;
  path?: string;
  referrer?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  // Privacy: No personal data, IP is hashed
  ipHash?: string;
}

export interface PageViewStats {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage?: number;
}

export interface ContentStats {
  contentId: string;
  contentType: ContentType;
  title: string;
  views: number;
  uniqueVisitors: number;
  comments: number;
  avgRating?: number;
  totalRatings: number;
}

export interface DashboardStats {
  totalViews: number;
  totalUniqueVisitors: number;
  totalContent: number;
  totalComments: number;
  totalRatings: number;
  avgRating: number;
  topContent: ContentStats[];
  recentActivity: AnalyticsEvent[];
  viewsByDay: { date: string; views: number }[];
}

export interface TrendData {
  period: string;
  data: {
    date: string;
    views: number;
    visitors: number;
  }[];
}

export interface PopularContent {
  contentType: ContentType | null;
  items: ContentStats[];
  period: string;
}
