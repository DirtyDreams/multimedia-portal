import { PrismaService } from '../../prisma/prisma.service';
import { CreateContentVersionDto, QueryContentVersionDto, VersionableType } from './dto';
export declare class ContentVersionsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(userId: string, createVersionDto: CreateContentVersionDto): Promise<any>;
    autoSaveVersion(userId: string, contentType: VersionableType, contentId: string, title: string, content: string, excerpt?: string, metadata?: Record<string, any>, changeNote?: string): Promise<any>;
    findAllForContent(contentType: VersionableType, contentId: string, queryDto: QueryContentVersionDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<any>;
    findByVersionNumber(contentType: VersionableType, contentId: string, versionNumber: number): Promise<any>;
    findLatestVersion(contentType: VersionableType, contentId: string): Promise<any>;
    compareVersions(contentType: VersionableType, contentId: string, versionA: number, versionB: number): Promise<{
        versionA: any;
        versionB: any;
        diff: {
            title: boolean;
            content: boolean;
            excerpt: boolean;
        };
    }>;
    pruneOldVersions(contentType: VersionableType, contentId: string, keepCount?: number): Promise<{
        deleted: any;
    }>;
    getRestoreData(contentType: VersionableType, contentId: string, versionNumber: number): Promise<{
        title: any;
        content: any;
        excerpt: any;
        metadata: any;
    }>;
    private verifyContentExists;
}
