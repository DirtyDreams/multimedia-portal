"use client";

import { useState } from "react";
import { MessageSquare, Edit2, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Comment, CommentableType } from "@/types/comment";
import { useAuth } from "@/hooks/use-auth";
import { AddCommentForm } from "./add-comment-form";
import { motion, AnimatePresence } from "framer-motion";

interface CommentItemProps {
  comment: Comment;
  contentType: CommentableType;
  contentId: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export function CommentItem({
  comment,
  contentType,
  contentId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  depth = 0,
  maxDepth = 3,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = user && user.id === comment.userId;
  const canModerate = user && (user.role === "admin" || user.role === "moderator");
  const canEdit = isOwner;
  const canDelete = isOwner || canModerate;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const updatedComment = await response.json();

      if (onCommentUpdated) {
        onCommentUpdated(updatedComment);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyAdded = (newComment: Comment) => {
    setIsReplying(false);
    if (onCommentAdded) {
      onCommentAdded(newComment);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}
    >
      <div className="bg-card rounded-lg p-4 border border-border">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {(comment.user.name || comment.user.username || "U")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">
                {comment.user.name || comment.user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.updatedAt !== comment.createdAt && " (edited)"}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {isAuthenticated && (canEdit || canDelete) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-muted rounded transition"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                    >
                      {canEdit && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted transition text-sm"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowMenu(false);
                          }}
                          disabled={isDeleting}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-500 transition text-sm disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2 mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isSaving}
                className="px-3 py-1 text-sm hover:bg-muted rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Reply Button */}
        {!isEditing && isAuthenticated && depth < maxDepth && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <MessageSquare className="h-3 w-3" />
            Reply {comment.repliesCount > 0 && `(${comment.repliesCount})`}
          </button>
        )}

        {/* Reply Form */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <AddCommentForm
                contentType={contentType}
                contentId={contentId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              onCommentAdded={onCommentAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
