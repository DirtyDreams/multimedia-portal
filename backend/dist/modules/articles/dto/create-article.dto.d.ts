declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateArticleDto {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status?: ContentStatus;
    authorId: string;
    categoryIds?: string[];
    tagIds?: string[];
}
export {};
