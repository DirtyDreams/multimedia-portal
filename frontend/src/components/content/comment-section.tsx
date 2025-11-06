"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Reply, ThumbsUp, Trash2, Flag } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  parentId?: string;
}

interface CommentSectionProps {
  contentId: string;
  comments: Comment[];
  totalComments: number;
  onAddComment?: (content: string, parentId?: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReportComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export function CommentSection({
  contentId,
  comments,
  totalComments,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onReportComment,
  isLoading = false,
}: CommentSectionProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: commentDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(replyContent, parentId);
      setReplyContent("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isAuthor = user?.id === comment.author.id;

    return (
      <div className={cn("space-y-3", isReply && "ml-12")}>
        <div className="flex gap-3">
          {/* Author Avatar */}
          <Link href={`/authors/${comment.author.id}`} className="flex-shrink-0">
            {comment.author.profileImage ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={comment.author.profileImage}
                  alt={comment.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/authors/${comment.author.id}`}
                className="font-medium text-sm hover:underline"
              >
                {comment.author.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                @{comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <time className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </time>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>

            <p className="text-sm whitespace-pre-wrap break-words mb-3">
              {comment.content}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => onLikeComment?.(comment.id)}
              >
                <ThumbsUp
                  className={cn(
                    "h-3 w-3 mr-1",
                    comment.isLiked && "fill-current text-blue-600"
                  )}
                />
                {comment.likes > 0 && comment.likes}
              </Button>

              {user && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {isAuthor && onDeleteComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                  onClick={() => onDeleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}

              {!isAuthor && onReportComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => onReportComment(comment.id)}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Report
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
          <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-2xl font-bold">
            Comments ({totalComments})
          </h2>
        </div>

        {/* Add Comment Form */}
        {user ? (
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Post Comment"}
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Please log in to leave a comment
            </p>
            <Link href="/login">
              <Button size="sm">Log In</Button>
            </Link>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
