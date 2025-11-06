"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Comment, CommentableType, CreateCommentData } from "@/types/comment";

interface AddCommentFormProps {
  contentType: CommentableType;
  contentId: string;
  parentId?: string;
  onCommentAdded?: (comment: Comment) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function AddCommentForm({
  contentType,
  contentId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
}: AddCommentFormProps) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (content.length > 5000) {
      setError("Comment is too long (max 5000 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const commentData: CreateCommentData = {
        content: content.trim(),
        contentType,
        contentId,
        ...(parentId && { parentId }),
      };

      const response = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post comment");
      }

      const newComment = await response.json();

      // Reset form
      setContent("");
      setError(null);

      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <a href="/login" className="text-primary hover:underline">
            log in
          </a>{" "}
          to leave a comment
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          rows={parentId ? 3 : 4}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-xs ${
              content.length > 5000
                ? "text-red-500"
                : content.length > 4500
                ? "text-yellow-500"
                : "text-muted-foreground"
            }`}
          >
            {content.length} / 5000
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Posting..." : parentId ? "Reply" : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
