declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateStoryDto {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    series?: string;
    status?: ContentStatus;
    authorId: string;
    categoryIds?: string[];
    tagIds?: string[];
}
export {};
