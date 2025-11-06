export enum CommentableType {
  ARTICLE = "ARTICLE",
  BLOG_POST = "BLOG_POST",
  WIKI_PAGE = "WIKI_PAGE",
  GALLERY_ITEM = "GALLERY_ITEM",
  STORY = "STORY",
}

export interface User {
  id: string;
  username: string;
  name?: string;
}

export interface Comment {
  id: string;
  content: string;
  contentType: CommentableType;
  contentId: string;
  parentId: string | null;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  repliesCount: number;
}

export interface CreateCommentData {
  content: string;
  contentType: CommentableType;
  contentId: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentsResponse {
  data: Comment[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
