import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

export interface ScheduledPublishJobData {
  contentType: 'article' | 'blogPost' | 'wikiPage' | 'galleryItem' | 'story';
  contentId: string;
}

@Processor('scheduled-publish')
export class ScheduledPublishProcessor {
  private readonly logger = new Logger(ScheduledPublishProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('publish-content')
  async handlePublishContent(job: Job<ScheduledPublishJobData>) {
    this.logger.log(`Processing scheduled publish job ${job.id}`);
    const { contentType, contentId } = job.data;

    try {
      await job.progress(10);

      this.logger.log(
        `Publishing scheduled content: ${contentType} ${contentId}`,
      );

      await job.progress(30);

      // Publish the content based on type
      const updateData = {
        status: 'PUBLISHED' as const,
        publishedAt: new Date(),
        scheduledPublishAt: null,
      };

      switch (contentType) {
        case 'article':
          await this.prisma.article.update({
            where: { id: contentId },
            data: updateData,
          });
          break;
        case 'blogPost':
          await this.prisma.blogPost.update({
            where: { id: contentId },
            data: updateData,
          });
          break;
        case 'wikiPage':
          await this.prisma.wikiPage.update({
            where: { id: contentId },
            data: updateData,
          });
          break;
        case 'galleryItem':
          await this.prisma.galleryItem.update({
            where: { id: contentId },
            data: updateData,
          });
          break;
        case 'story':
          await this.prisma.story.update({
            where: { id: contentId },
            data: updateData,
          });
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }

      await job.progress(100);

      this.logger.log(
        `Successfully published scheduled content: ${contentType} ${contentId}`,
      );

      return {
        success: true,
        publishedAt: new Date(),
        contentType,
        contentId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to publish scheduled content ${contentType} ${contentId}:`,
        error,
      );
      throw error;
    }
  }

  @Process('check-scheduled-content')
  async handleCheckScheduledContent(job: Job) {
    this.logger.log(`Checking for scheduled content to publish`);

    try {
      await job.progress(10);

      const now = new Date();

      // Find all content that should be published now
      const articles = await this.prisma.article.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      const blogPosts = await this.prisma.blogPost.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      const wikiPages = await this.prisma.wikiPage.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      const galleryItems = await this.prisma.galleryItem.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      const stories = await this.prisma.story.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            lte: now,
          },
        },
        select: { id: true },
      });

      await job.progress(50);

      const totalContent =
        articles.length +
        blogPosts.length +
        wikiPages.length +
        galleryItems.length +
        stories.length;

      this.logger.log(`Found ${totalContent} scheduled content items to publish`);

      // Publish all content immediately (in bulk)
      const updateData = {
        status: 'PUBLISHED' as const,
        publishedAt: now,
        scheduledPublishAt: null,
      };

      if (articles.length > 0) {
        await this.prisma.article.updateMany({
          where: {
            id: { in: articles.map((a) => a.id) },
          },
          data: updateData,
        });
      }

      if (blogPosts.length > 0) {
        await this.prisma.blogPost.updateMany({
          where: {
            id: { in: blogPosts.map((b) => b.id) },
          },
          data: updateData,
        });
      }

      if (wikiPages.length > 0) {
        await this.prisma.wikiPage.updateMany({
          where: {
            id: { in: wikiPages.map((w) => w.id) },
          },
          data: updateData,
        });
      }

      if (galleryItems.length > 0) {
        await this.prisma.galleryItem.updateMany({
          where: {
            id: { in: galleryItems.map((g) => g.id) },
          },
          data: updateData,
        });
      }

      if (stories.length > 0) {
        await this.prisma.story.updateMany({
          where: {
            id: { in: stories.map((s) => s.id) },
          },
          data: updateData,
        });
      }

      await job.progress(100);

      this.logger.log(`Successfully published ${totalContent} scheduled content items`);

      return {
        success: true,
        published: totalContent,
        breakdown: {
          articles: articles.length,
          blogPosts: blogPosts.length,
          wikiPages: wikiPages.length,
          galleryItems: galleryItems.length,
          stories: stories.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to check and publish scheduled content:', error);
      throw error;
    }
  }
}
