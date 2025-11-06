export declare enum ContentTypeFilter {
    ARTICLE = "article",
    BLOG_POST = "blogPost",
    WIKI_PAGE = "wikiPage",
    GALLERY_ITEM = "galleryItem",
    STORY = "story"
}
export declare class SearchQueryDto {
    q: string;
    contentTypes?: ContentTypeFilter[];
    limit?: number;
    offset?: number;
    attributesToRetrieve?: string[];
    facets?: string[];
    filter?: string;
}
