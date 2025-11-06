-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "ContentStatus" ADD VALUE 'SCHEDULED';

-- CreateEnum
CREATE TYPE "VersionableType" AS ENUM ('ARTICLE', 'BLOG_POST', 'WIKI_PAGE', 'GALLERY_ITEM', 'STORY');

-- AlterTable: Add scheduledPublishAt to Article
ALTER TABLE "articles" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable: Add scheduledPublishAt to BlogPost
ALTER TABLE "blog_posts" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable: Add scheduledPublishAt to WikiPage
ALTER TABLE "wiki_pages" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable: Add scheduledPublishAt to GalleryItem
ALTER TABLE "gallery_items" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable: Add scheduledPublishAt to Story
ALTER TABLE "stories" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

-- CreateTable: ContentVersion
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentType" "VersionableType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "metadata" JSONB,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_versions_contentType_contentId_idx" ON "content_versions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "content_versions_userId_idx" ON "content_versions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentType_contentId_versionNumber_key" ON "content_versions"("contentType", "contentId", "versionNumber");

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
