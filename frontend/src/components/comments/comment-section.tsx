"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Comment, CommentableType } from "@/types/comment";
import { CommentList } from "./comment-list";
import { AddCommentForm } from "./add-comment-form";

interface CommentSectionProps {
  contentType: CommentableType;
  contentId: string;
  title?: string;
}

export function CommentSection({
  contentType,
  contentId,
  title = "Comments",
}: CommentSectionProps) {
  const queryClient = useQueryClient();

  const handleCommentAdded = (newComment: Comment) => {
    // Invalidate and refetch comments
    queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
  };

  return (
    <div className="mt-12 border-t border-border pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Add Comment Form */}
      <div className="mb-8">
        <AddCommentForm
          contentType={contentType}
          contentId={contentId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      <CommentList contentType={contentType} contentId={contentId} />
    </div>
  );
}
