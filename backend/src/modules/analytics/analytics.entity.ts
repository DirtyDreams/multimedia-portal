/**
 * Analytics Entity Types
 * Privacy-friendly analytics without storing personal data
 */

export enum EventType {
  PAGE_VIEW = 'page_view',
  CONTENT_VIEW = 'content_view',
  SEARCH = 'search',
  ENGAGEMENT = 'engagement',
}

export enum ContentType {
  ARTICLE = 'article',
  BLOG_POST = 'blog_post',
  WIKI_PAGE = 'wiki_page',
  GALLERY_ITEM = 'gallery_item',
  STORY = 'story',
}

export interface PageViewEvent {
  path: string;
  referrer?: string;
  userAgent?: string;
  sessionHash: string; // Hashed session ID
  timestamp: Date;
  duration?: number; // Time spent on page in seconds
}

export interface ContentViewEvent {
  contentType: ContentType;
  contentId: string;
  sessionHash: string;
  timestamp: Date;
  duration?: number;
}

export interface SearchEvent {
  query: string;
  resultsCount: number;
  sessionHash: string;
  timestamp: Date;
}

export interface EngagementEvent {
  eventName: string; // 'comment', 'rating', 'share', etc.
  contentType: ContentType;
  contentId: string;
  sessionHash: string;
  timestamp: Date;
}

/**
 * Aggregated Analytics Data (stored in Redis)
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalPageViews: number;
  uniqueSessions: number;
  totalContentViews: number;
  averageDuration: number;
  popularPaths: Record<string, number>;
  popularContent: Record<string, number>;
  topSearches: Record<string, number>;
}

export interface PopularContentItem {
  contentType: ContentType;
  contentId: string;
  title: string;
  views: number;
  averageDuration: number;
  engagements: number;
}

export interface TrendData {
  period: string; // 'daily', 'weekly', 'monthly'
  label: string; // Date label
  pageViews: number;
  uniqueSessions: number;
  contentViews: number;
  averageDuration: number;
}
