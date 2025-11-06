"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Search, Filter, CheckSquare, Square } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Comment, CommentableType } from "@/types/comment";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

interface CommentModerationProps {
  contentType?: CommentableType;
  contentId?: string;
}

export function CommentModeration({ contentType, contentId }: CommentModerationProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<"all" | CommentableType>("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch all comments for moderation
  const { data: commentsData, isLoading } = useQuery<{ data: Comment[]; meta: any }>({
    queryKey: ["comments-moderation", contentType, contentId, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", "100");

      if (contentType) params.append("contentType", contentType);
      if (contentId) params.append("contentId", contentId);
      if (filterType !== "all") params.append("contentType", filterType);

      const response = await fetch(`${API_URL}/comments?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      return response.json();
    },
    enabled: user?.role === "admin" || user?.role === "moderator",
  });

  const comments = commentsData?.data || [];

  // Filter comments by search query
  const filteredComments = comments.filter((comment) =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(filteredComments.map((c) => c.id)));
    }
  };

  const handleSelectComment = (commentId: string) => {
    const newSelection = new Set(selectedComments);
    if (newSelection.has(commentId)) {
      newSelection.delete(commentId);
    } else {
      newSelection.add(commentId);
    }
    setSelectedComments(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedComments.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedComments.size} comment(s)?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Delete comments sequentially
      for (const commentId of Array.from(selectedComments)) {
        await fetch(`${API_URL}/comments/${commentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear selection and refetch
      setSelectedComments(new Set());
      queryClient.invalidateQueries({ queryKey: ["comments-moderation"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    } catch (error) {
      console.error("Error deleting comments:", error);
      alert("Failed to delete some comments. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "moderator") {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-500 font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">
          You need admin or moderator privileges to access this page.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Comment Moderation</h1>
            <p className="text-sm text-muted-foreground">
              {filteredComments.length} comment(s) found
            </p>
          </div>
        </div>

        {selectedComments.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedComments.size})
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {!contentType && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value={CommentableType.ARTICLE}>Articles</option>
            <option value={CommentableType.BLOG_POST}>Blog Posts</option>
            <option value={CommentableType.WIKI_PAGE}>Wiki Pages</option>
            <option value={CommentableType.GALLERY_ITEM}>Gallery</option>
            <option value={CommentableType.STORY}>Stories</option>
          </select>
        )}
      </div>

      {/* Comments Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No comments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left">
                    <button onClick={handleSelectAll} className="hover:text-primary">
                      {selectedComments.size === filteredComments.length ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-semibold">Author</th>
                  <th className="p-4 text-left font-semibold">Content</th>
                  <th className="p-4 text-left font-semibold">Type</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredComments.map((comment) => (
                    <motion.tr
                      key={comment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border hover:bg-muted/50 transition"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleSelectComment(comment.id)}
                          className="hover:text-primary"
                        >
                          {selectedComments.has(comment.id) ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{comment.user.name || comment.user.username}</p>
                          <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="line-clamp-2 text-sm">{comment.content}</p>
                        {comment.parentId && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded">
                            Reply
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {comment.contentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            if (confirm("Delete this comment?")) {
                              try {
                                const token = localStorage.getItem("accessToken");
                                await fetch(`${API_URL}/comments/${comment.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                queryClient.invalidateQueries({ queryKey: ["comments-moderation"] });
                                queryClient.invalidateQueries({ queryKey: ["comments"] });
                              } catch (error) {
                                alert("Failed to delete comment");
                              }
                            }
                          }}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
