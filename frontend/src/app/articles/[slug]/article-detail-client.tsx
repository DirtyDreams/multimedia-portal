"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Calendar, User, Eye } from "lucide-react";
import Image from "next/image";
import { CommentSection } from "@/components/comments";
import { RatingWidget } from "@/components/rating";
import { CommentableType } from "@/types/comment";
import { RatableType } from "@/types/rating";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: string;
  featuredImage?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    bio?: string;
  };
  user: {
    id: string;
    username: string;
    name?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  commentsCount: number;
  ratingsCount: number;
}

interface ArticleDetailClientProps {
  slug: string;
}

export function ArticleDetailClient({ slug }: ArticleDetailClientProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ["article", slug],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/articles/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Article not found");
        }
        throw new Error("Failed to fetch article");
      }

      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading article...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-red-500 font-semibold">Article not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The article you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative mb-8 rounded-lg overflow-hidden h-[400px]">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
          </div>
        )}

        {/* Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground border-y border-border py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>By {article.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(article.publishedAt || article.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{article.commentsCount} comments</span>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-border">
            <span className="text-sm text-muted-foreground mr-2">Tags:</span>
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-muted text-sm rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio */}
        {article.author.bio && (
          <div className="p-6 bg-card border border-border rounded-lg mb-8">
            <h3 className="font-semibold mb-2">About the Author</h3>
            <p className="text-sm text-muted-foreground">{article.author.bio}</p>
          </div>
        )}

        {/* Rating Widget */}
        <RatingWidget
          contentType={RatableType.ARTICLE}
          contentId={article.id}
        />

        {/* Comment Section */}
        <CommentSection
          contentType={CommentableType.ARTICLE}
          contentId={article.id}
          title="Comments"
        />
      </article>
    </div>
  );
}
