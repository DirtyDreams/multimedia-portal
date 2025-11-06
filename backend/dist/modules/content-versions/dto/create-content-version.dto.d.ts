export declare enum VersionableType {
    ARTICLE = "ARTICLE",
    BLOG_POST = "BLOG_POST",
    WIKI_PAGE = "WIKI_PAGE",
    GALLERY_ITEM = "GALLERY_ITEM",
    STORY = "STORY"
}
export declare class CreateContentVersionDto {
    contentType: VersionableType;
    contentId: string;
    versionNumber: number;
    title: string;
    content: string;
    excerpt?: string;
    metadata?: Record<string, any>;
    changeNote?: string;
}
