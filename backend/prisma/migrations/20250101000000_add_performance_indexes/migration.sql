-- Add Performance-Optimized Indexes for Query Optimization
-- Migration: 2025010100000_add_performance_indexes
-- Purpose: Optimize database query performance for frequently accessed patterns

-- ============================================
-- USER & AUTHENTICATION INDEXES
-- ============================================

-- User table: Add role and createdAt indexes
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- Session table: Add composite and expiration indexes
CREATE INDEX IF NOT EXISTS "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- ============================================
-- AUTHOR INDEXES
-- ============================================

-- Author table: Add name and createdAt indexes
CREATE INDEX IF NOT EXISTS "authors_name_idx" ON "authors"("name");
CREATE INDEX IF NOT EXISTS "authors_createdAt_idx" ON "authors"("createdAt");

-- ============================================
-- ARTICLE INDEXES
-- ============================================

-- Articles: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "articles_createdAt_idx" ON "articles"("createdAt");
CREATE INDEX IF NOT EXISTS "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "articles_status_createdAt_idx" ON "articles"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "articles_authorId_status_idx" ON "articles"("authorId", "status");
CREATE INDEX IF NOT EXISTS "articles_userId_createdAt_idx" ON "articles"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "articles_title_idx" ON "articles"("title");

-- Junction table indexes for reverse lookups
CREATE INDEX IF NOT EXISTS "article_categories_categoryId_idx" ON "article_categories"("categoryId");
CREATE INDEX IF NOT EXISTS "article_tags_tagId_idx" ON "article_tags"("tagId");

-- ============================================
-- BLOG POST INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "blog_posts_createdAt_idx" ON "blog_posts"("createdAt");
CREATE INDEX IF NOT EXISTS "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "blog_posts_status_createdAt_idx" ON "blog_posts"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "blog_posts_authorId_status_idx" ON "blog_posts"("authorId", "status");
CREATE INDEX IF NOT EXISTS "blog_posts_userId_createdAt_idx" ON "blog_posts"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "blog_posts_title_idx" ON "blog_posts"("title");

-- Junction table indexes
CREATE INDEX IF NOT EXISTS "blog_post_categories_categoryId_idx" ON "blog_post_categories"("categoryId");
CREATE INDEX IF NOT EXISTS "blog_post_tags_tagId_idx" ON "blog_post_tags"("tagId");

-- ============================================
-- WIKI PAGE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "wiki_pages_createdAt_idx" ON "wiki_pages"("createdAt");
CREATE INDEX IF NOT EXISTS "wiki_pages_status_publishedAt_idx" ON "wiki_pages"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "wiki_pages_status_createdAt_idx" ON "wiki_pages"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "wiki_pages_authorId_status_idx" ON "wiki_pages"("authorId", "status");
CREATE INDEX IF NOT EXISTS "wiki_pages_userId_createdAt_idx" ON "wiki_pages"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "wiki_pages_title_idx" ON "wiki_pages"("title");
CREATE INDEX IF NOT EXISTS "wiki_pages_parentId_status_idx" ON "wiki_pages"("parentId", "status");

-- Junction table indexes
CREATE INDEX IF NOT EXISTS "wiki_page_categories_categoryId_idx" ON "wiki_page_categories"("categoryId");
CREATE INDEX IF NOT EXISTS "wiki_page_tags_tagId_idx" ON "wiki_page_tags"("tagId");

-- ============================================
-- GALLERY ITEM INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "gallery_items_createdAt_idx" ON "gallery_items"("createdAt");
CREATE INDEX IF NOT EXISTS "gallery_items_status_publishedAt_idx" ON "gallery_items"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "gallery_items_status_createdAt_idx" ON "gallery_items"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "gallery_items_authorId_status_idx" ON "gallery_items"("authorId", "status");
CREATE INDEX IF NOT EXISTS "gallery_items_userId_createdAt_idx" ON "gallery_items"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "gallery_items_title_idx" ON "gallery_items"("title");
CREATE INDEX IF NOT EXISTS "gallery_items_fileType_status_idx" ON "gallery_items"("fileType", "status");

-- Junction table indexes
CREATE INDEX IF NOT EXISTS "gallery_item_categories_categoryId_idx" ON "gallery_item_categories"("categoryId");
CREATE INDEX IF NOT EXISTS "gallery_item_tags_tagId_idx" ON "gallery_item_tags"("tagId");

-- ============================================
-- STORY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "stories_createdAt_idx" ON "stories"("createdAt");
CREATE INDEX IF NOT EXISTS "stories_status_publishedAt_idx" ON "stories"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "stories_status_createdAt_idx" ON "stories"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "stories_authorId_status_idx" ON "stories"("authorId", "status");
CREATE INDEX IF NOT EXISTS "stories_userId_createdAt_idx" ON "stories"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "stories_title_idx" ON "stories"("title");
CREATE INDEX IF NOT EXISTS "stories_series_status_idx" ON "stories"("series", "status");

-- Junction table indexes
CREATE INDEX IF NOT EXISTS "story_categories_categoryId_idx" ON "story_categories"("categoryId");
CREATE INDEX IF NOT EXISTS "story_tags_tagId_idx" ON "story_tags"("tagId");

-- ============================================
-- COMMENT SYSTEM INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "comments_contentType_contentId_createdAt_idx" ON "comments"("contentType", "contentId", "createdAt");
CREATE INDEX IF NOT EXISTS "comments_userId_createdAt_idx" ON "comments"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "comments_createdAt_idx" ON "comments"("createdAt");
CREATE INDEX IF NOT EXISTS "comments_parentId_createdAt_idx" ON "comments"("parentId", "createdAt");

-- ============================================
-- RATING SYSTEM INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "ratings_contentType_contentId_createdAt_idx" ON "ratings"("contentType", "contentId", "createdAt");
CREATE INDEX IF NOT EXISTS "ratings_createdAt_idx" ON "ratings"("createdAt");
CREATE INDEX IF NOT EXISTS "ratings_contentType_contentId_value_idx" ON "ratings"("contentType", "contentId", "value");

-- ============================================
-- CATEGORY & TAG INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories"("name");
CREATE INDEX IF NOT EXISTS "categories_createdAt_idx" ON "categories"("createdAt");

CREATE INDEX IF NOT EXISTS "tags_name_idx" ON "tags"("name");
CREATE INDEX IF NOT EXISTS "tags_createdAt_idx" ON "tags"("createdAt");

-- ============================================
-- VERSION HISTORY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "content_versions_contentType_contentId_createdAt_idx" ON "content_versions"("contentType", "contentId", "createdAt");
CREATE INDEX IF NOT EXISTS "content_versions_createdAt_idx" ON "content_versions"("createdAt");

-- ============================================
-- NOTIFICATION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");

-- ============================================
-- EMAIL QUEUE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "email_queue_status_createdAt_idx" ON "email_queue"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "email_queue_createdAt_idx" ON "email_queue"("createdAt");
CREATE INDEX IF NOT EXISTS "email_queue_status_attempts_idx" ON "email_queue"("status", "attempts");

-- ============================================
-- ANALYZE TABLES FOR UPDATED STATISTICS
-- ============================================

-- Update PostgreSQL statistics for query planner optimization
ANALYZE "users";
ANALYZE "sessions";
ANALYZE "authors";
ANALYZE "articles";
ANALYZE "blog_posts";
ANALYZE "wiki_pages";
ANALYZE "gallery_items";
ANALYZE "stories";
ANALYZE "comments";
ANALYZE "ratings";
ANALYZE "categories";
ANALYZE "tags";
ANALYZE "article_categories";
ANALYZE "article_tags";
ANALYZE "blog_post_categories";
ANALYZE "blog_post_tags";
ANALYZE "wiki_page_categories";
ANALYZE "wiki_page_tags";
ANALYZE "gallery_item_categories";
ANALYZE "gallery_item_tags";
ANALYZE "story_categories";
ANALYZE "story_tags";
ANALYZE "content_versions";
ANALYZE "notifications";
ANALYZE "email_queue";
