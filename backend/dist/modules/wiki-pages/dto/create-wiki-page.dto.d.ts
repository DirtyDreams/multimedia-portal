declare enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateWikiPageDto {
    title: string;
    content: string;
    status?: ContentStatus;
    authorId: string;
    parentId?: string;
    categoryIds?: string[];
    tagIds?: string[];
}
export {};
