declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class QueryGalleryItemDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContentStatus;
    authorId?: string;
    fileType?: 'image' | 'video';
    category?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
