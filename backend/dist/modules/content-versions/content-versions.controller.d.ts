import { ContentVersionsService } from './content-versions.service';
import { CreateContentVersionDto, QueryContentVersionDto, VersionableType } from './dto';
export declare class ContentVersionsController {
    private readonly contentVersionsService;
    constructor(contentVersionsService: ContentVersionsService);
    create(user: any, createVersionDto: CreateContentVersionDto): Promise<any>;
    findAllForContent(contentType: VersionableType, contentId: string, queryDto: QueryContentVersionDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findLatestVersion(contentType: VersionableType, contentId: string): Promise<any>;
    findByVersionNumber(contentType: VersionableType, contentId: string, versionNumber: string): Promise<any>;
    compareVersions(contentType: VersionableType, contentId: string, versionA: string, versionB: string): Promise<{
        versionA: any;
        versionB: any;
        diff: {
            title: boolean;
            content: boolean;
            excerpt: boolean;
        };
    }>;
    getRestoreData(contentType: VersionableType, contentId: string, versionNumber: string): Promise<{
        title: any;
        content: any;
        excerpt: any;
        metadata: any;
    }>;
    pruneOldVersions(contentType: VersionableType, contentId: string, keepCount?: string): Promise<{
        deleted: any;
    }>;
}
