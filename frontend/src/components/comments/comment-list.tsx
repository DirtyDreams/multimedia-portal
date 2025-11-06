"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Comment, CommentableType } from "@/types/comment";
import { CommentItem } from "./comment-item";
import { motion, AnimatePresence } from "framer-motion";

interface CommentListProps {
  contentType: CommentableType;
  contentId: string;
}

export function CommentList({ contentType, contentId }: CommentListProps) {
  const queryClient = useQueryClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[]>({
    queryKey: ["comments", contentType, contentId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/comments/content/${contentType}/${contentId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      return response.json();
    },
  });

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

  return (
    <div className="space-y-4">
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
    </div>
  );
}
