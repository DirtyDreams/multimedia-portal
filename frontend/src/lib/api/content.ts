import { api } from "../api";
import {
  Content,
  ContentType,
  ContentFilters,
  PaginatedResponse,
} from "@/types/content";

/**
 * Content API service
 */

// Get API endpoint for content type
const getContentEndpoint = (contentType: ContentType): string => {
  const endpoints: Record<ContentType, string> = {
    article: "/articles",
    blogPost: "/blog",
    wikiPage: "/wiki",
    galleryItem: "/gallery",
    story: "/stories",
  };
  return endpoints[contentType];
};

// Fetch paginated list of content
export async function fetchContentList(
  contentType: ContentType,
  filters?: ContentFilters
): Promise<PaginatedResponse<Content>> {
  const endpoint = getContentEndpoint(contentType);
  const params = new URLSearchParams();

  if (filters?.search) params.append("search", filters.search);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.tag) params.append("tag", filters.tag);
  if (filters?.author) params.append("author", filters.author);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  const response = await api.get<PaginatedResponse<Content>>(url);
  return response.data;
}

// Fetch single content item by slug
export async function fetchContentBySlug(
  contentType: ContentType,
  slug: string
): Promise<Content> {
  const endpoint = getContentEndpoint(contentType);
  const response = await api.get<Content>(`${endpoint}/${slug}`);
  return response.data;
}

// Submit rating for content
export async function rateContent(
  contentType: ContentType,
  contentId: string,
  rating: number
): Promise<void> {
  await api.post("/ratings", {
    contentType,
    contentId,
    rating,
  });
}

// Fetch comments for content
export async function fetchComments(
  contentType: ContentType,
  contentId: string
): Promise<any[]> {
  const response = await api.get(`/comments`, {
    params: {
      contentType,
      contentId,
    },
  });
  return response.data;
}

// Add comment to content
export async function addComment(
  contentType: ContentType,
  contentId: string,
  content: string,
  parentId?: string
): Promise<any> {
  const response = await api.post("/comments", {
    contentType,
    contentId,
    content,
    parentId,
  });
  return response.data;
}

// Delete comment
export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

// Like/unlike comment
export async function likeComment(commentId: string): Promise<void> {
  await api.post(`/comments/${commentId}/like`);
}

// Report comment
export async function reportComment(commentId: string, reason: string): Promise<void> {
  await api.post(`/comments/${commentId}/report`, { reason });
}

// Increment view count
export async function incrementViewCount(
  contentType: ContentType,
  contentId: string
): Promise<void> {
  await api.post(`${getContentEndpoint(contentType)}/${contentId}/view`);
}
