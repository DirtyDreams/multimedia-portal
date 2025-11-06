declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class QueryBlogPostDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    authorId?: string;
    category?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
