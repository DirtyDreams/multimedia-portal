"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Comment, CommentableType, CommentsResponse } from "@/types/comment";
import { CommentItem } from "./comment-item";
import { motion, AnimatePresence } from "framer-motion";

interface CommentListProps {
  contentType: CommentableType;
  contentId: string;
  pageSize?: number;
}

export function CommentList({ contentType, contentId, pageSize = 10 }: CommentListProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const {
    data: commentsData,
    isLoading,
    error,
    isFetching,
  } = useQuery<CommentsResponse>({
    queryKey: ["comments", contentType, contentId, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("contentType", contentType);
      params.append("contentId", contentId);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`${API_URL}/comments?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      return response.json();
    },
  });

  const comments = commentsData?.data || [];
  const meta = commentsData?.meta;

  const handleCommentAdded = (newComment: Comment) => {
    // Invalidate and refetch comments
    queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    // Invalidate and refetch comments
    queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
  };

  const handleCommentDeleted = (commentId: string) => {
    // Invalidate and refetch comments
    queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
        <p className="text-red-500">Failed to load comments. Please try again later.</p>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-muted rounded-full">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
        <p className="text-muted-foreground">
          Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  const hasMore = meta ? page < meta.totalPages : false;
  const showingCount = comments.length;
  const totalCount = meta?.total || 0;

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      {meta && totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {showingCount} of {totalCount} comment{totalCount !== 1 ? "s" : ""}
          </p>
          {meta.totalPages > 1 && (
            <p>
              Page {page} of {meta.totalPages}
            </p>
          )}
        </div>
      )}

      {/* Comments List */}
      <AnimatePresence mode="popLayout">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            contentType={contentType}
            contentId={contentId}
            onCommentAdded={handleCommentAdded}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
          />
        ))}
      </AnimatePresence>

      {/* Load More / Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {/* Previous Button */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              let pageNum;
              if (meta.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= meta.totalPages - 2) {
                pageNum = meta.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={isFetching}
                  className={`px-3 py-2 rounded-lg transition text-sm disabled:cursor-not-allowed ${
                    page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={!hasMore || isFetching}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isFetching ? "Loading..." : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
