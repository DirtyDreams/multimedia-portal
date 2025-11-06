import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export interface ScheduledPublishJobData {
    contentType: 'article' | 'blogPost' | 'wikiPage' | 'galleryItem' | 'story';
    contentId: string;
}
export declare class ScheduledPublishProcessor {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handlePublishContent(job: Job<ScheduledPublishJobData>): Promise<{
        success: boolean;
        publishedAt: Date;
        contentType: "article" | "blogPost" | "wikiPage" | "galleryItem" | "story";
        contentId: string;
    }>;
    handleCheckScheduledContent(job: Job): Promise<{
        success: boolean;
        published: any;
        breakdown: {
            articles: any;
            blogPosts: any;
            wikiPages: any;
            galleryItems: any;
            stories: any;
        };
    }>;
}
