export enum ContentTypeFilter {
  ARTICLE = "article",
  BLOG_POST = "blogPost",
  WIKI_PAGE = "wikiPage",
  GALLERY_ITEM = "galleryItem",
  STORY = "story",
}

export interface SearchQuery {
  q: string;
  contentTypes?: ContentTypeFilter[];
  limit?: number;
  offset?: number;
  attributesToRetrieve?: string[];
  facets?: string[];
  filter?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  contentType: ContentTypeFilter;
  slug: string;
  authorName?: string;
  publishedAt?: string;
  _formatted?: {
    title?: string;
    content?: string;
    excerpt?: string;
  };
}

export interface SearchResponse {
  hits: SearchResult[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

export interface AutocompleteResult {
  id: string;
  title: string;
  contentType: ContentTypeFilter;
  slug: string;
}
