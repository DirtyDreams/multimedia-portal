declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class QueryWikiPageDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    authorId?: string;
    parentId?: string;
    category?: string;
    tag?: string;
    includeChildren?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
