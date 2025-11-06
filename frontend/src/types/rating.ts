export enum RatableType {
  ARTICLE = "ARTICLE",
  BLOG_POST = "BLOG_POST",
  WIKI_PAGE = "WIKI_PAGE",
  GALLERY_ITEM = "GALLERY_ITEM",
  STORY = "STORY",
}

export interface Rating {
  id: string;
  value: number;
  contentType: RatableType;
  contentId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    name?: string;
  };
}

export interface CreateRatingData {
  value: number;
  contentType: RatableType;
  contentId: string;
}

export interface UpdateRatingData {
  value: number;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
