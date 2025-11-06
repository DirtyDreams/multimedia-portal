export declare enum RatableType {
    ARTICLE = "ARTICLE",
    BLOG_POST = "BLOG_POST",
    WIKI_PAGE = "WIKI_PAGE",
    GALLERY_ITEM = "GALLERY_ITEM",
    STORY = "STORY"
}
export declare class CreateRatingDto {
    value: number;
    contentType: RatableType;
    contentId: string;
}
