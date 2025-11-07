-- Drop old indexes on Comments table
DROP INDEX IF EXISTS "comments_contentType_contentId_idx";
DROP INDEX IF EXISTS "comments_userId_idx";

-- Create new composite indexes on Comments table
CREATE INDEX "comments_contentType_contentId_createdAt_idx" ON "comments"("contentType", "contentId", "createdAt");
CREATE INDEX "comments_userId_contentType_idx" ON "comments"("userId", "contentType");

-- Drop old indexes on Ratings table
DROP INDEX IF EXISTS "ratings_contentType_contentId_idx";
DROP INDEX IF EXISTS "ratings_userId_idx";

-- Create new composite indexes on Ratings table
CREATE INDEX "ratings_contentType_contentId_createdAt_idx" ON "ratings"("contentType", "contentId", "createdAt");
CREATE INDEX "ratings_userId_contentType_idx" ON "ratings"("userId", "contentType");
