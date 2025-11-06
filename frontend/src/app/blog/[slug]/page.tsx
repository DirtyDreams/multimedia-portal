"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import { ContentDetail, CommentSection, RatingWidget } from "@/components/content";
import {
  useContent,
  useComments,
  useAddComment,
  useDeleteComment,
  useLikeComment,
  useRateContent,
  useIncrementViewCount,
} from "@/hooks/use-content";

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = params;
  const { data: content, isLoading, error } = useContent("blogPost", slug);
  const { data: comments, isLoading: commentsLoading } = useComments(
    "blogPost",
    content?.id || ""
  );

  const addCommentMutation = useAddComment("blogPost", content?.id || "");
  const deleteCommentMutation = useDeleteComment("blogPost", content?.id || "");
  const likeCommentMutation = useLikeComment("blogPost", content?.id || "");
  const rateContentMutation = useRateContent("blogPost");
  const incrementViewMutation = useIncrementViewCount("blogPost");

  // Increment view count on page load
  useEffect(() => {
    if (content?.id) {
      incrementViewMutation.mutate(content.id);
    }
  }, [content?.id]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <p className="font-medium">Failed to load blog post</p>
            <p className="text-sm mt-1">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && !content) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Content Detail */}
        <ContentDetail content={content!} isLoading={isLoading} />

        {/* Rating Widget */}
        {content && (
          <RatingWidget
            contentId={content.id}
            averageRating={4.5} // TODO: Get from content
            totalRatings={42} // TODO: Get from content
            onRate={(rating) =>
              rateContentMutation.mutateAsync({ contentId: content.id, rating })
            }
          />
        )}

        {/* Comment Section */}
        {content && (
          <CommentSection
            contentId={content.id}
            comments={comments || []}
            totalComments={comments?.length || 0}
            isLoading={commentsLoading}
            onAddComment={(content, parentId) =>
              addCommentMutation.mutateAsync({ content, parentId })
            }
            onDeleteComment={(commentId) =>
              deleteCommentMutation.mutateAsync(commentId)
            }
            onLikeComment={(commentId) => likeCommentMutation.mutateAsync(commentId)}
          />
        )}
      </div>
    </div>
  );
}
