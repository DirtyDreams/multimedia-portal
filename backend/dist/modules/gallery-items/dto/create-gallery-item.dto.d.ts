declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateGalleryItemDto {
    title: string;
    description?: string;
    status?: ContentStatus;
    authorId: string;
    categoryIds?: string[];
    tagIds?: string[];
}
export {};
