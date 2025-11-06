export type ContentType = "article" | "blogPost" | "wikiPage" | "galleryItem" | "story";

export interface BaseContent {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  author?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  categories?: Category[];
  tags?: Tag[];
}

export interface Article extends BaseContent {
  type: "article";
}

export interface BlogPost extends BaseContent {
  type: "blogPost";
}

export interface WikiPage extends BaseContent {
  type: "wikiPage";
  parentId?: string;
  order?: number;
}

export interface GalleryItem extends BaseContent {
  type: "galleryItem";
  mediaType: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
}

export interface Story extends BaseContent {
  type: "story";
  seriesId?: string;
  episodeNumber?: number;
}

export type Content = Article | BlogPost | WikiPage | GalleryItem | Story;

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContentFilters {
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "viewCount" | "title";
  sortOrder?: "asc" | "desc";
}
