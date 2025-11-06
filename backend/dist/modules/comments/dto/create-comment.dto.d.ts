export declare enum CommentableType {
    ARTICLE = "ARTICLE",
    BLOG_POST = "BLOG_POST",
    WIKI_PAGE = "WIKI_PAGE",
    GALLERY_ITEM = "GALLERY_ITEM",
    STORY = "STORY"
}
export declare class CreateCommentDto {
    content: string;
    contentType: CommentableType;
    contentId: string;
    parentId?: string;
}
