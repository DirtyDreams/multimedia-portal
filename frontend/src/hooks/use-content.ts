import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchContentList,
  fetchContentBySlug,
  rateContent,
  fetchComments,
  addComment,
  deleteComment,
  likeComment,
  reportComment,
  incrementViewCount,
} from "@/lib/api/content";
import { ContentType, ContentFilters } from "@/types/content";

/**
 * Hook to fetch paginated content list
 */
export function useContentList(contentType: ContentType, filters?: ContentFilters) {
  return useQuery({
    queryKey: ["content", contentType, filters],
    queryFn: () => fetchContentList(contentType, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single content by slug
 */
export function useContent(contentType: ContentType, slug: string) {
  return useQuery({
    queryKey: ["content", contentType, slug],
    queryFn: () => fetchContentBySlug(contentType, slug),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to rate content
 */
export function useRateContent(contentType: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, rating }: { contentId: string; rating: number }) =>
      rateContent(contentType, contentId, rating),
    onSuccess: (_, variables) => {
      // Invalidate content queries to refetch with new rating
      queryClient.invalidateQueries({
        queryKey: ["content", contentType],
      });
    },
  });
}

/**
 * Hook to fetch comments
 */
export function useComments(contentType: ContentType, contentId: string) {
  return useQuery({
    queryKey: ["comments", contentType, contentId],
    queryFn: () => fetchComments(contentType, contentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to add comment
 */
export function useAddComment(contentType: ContentType, contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      addComment(contentType, contentId, content, parentId),
    onSuccess: () => {
      // Invalidate comments to refetch
      queryClient.invalidateQueries({
        queryKey: ["comments", contentType, contentId],
      });
    },
  });
}

/**
 * Hook to delete comment
 */
export function useDeleteComment(contentType: ContentType, contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", contentType, contentId],
      });
    },
  });
}

/**
 * Hook to like comment
 */
export function useLikeComment(contentType: ContentType, contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", contentType, contentId],
      });
    },
  });
}

/**
 * Hook to report comment
 */
export function useReportComment() {
  return useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) =>
      reportComment(commentId, reason),
  });
}

/**
 * Hook to increment view count
 */
export function useIncrementViewCount(contentType: ContentType) {
  return useMutation({
    mutationFn: (contentId: string) => incrementViewCount(contentType, contentId),
  });
}
