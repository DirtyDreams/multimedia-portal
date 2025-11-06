"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Calendar, User, Eye, Tag as TagIcon } from "lucide-react";
import { Content } from "@/types/content";

interface ContentDetailProps {
  content: Content;
  isLoading?: boolean;
}

export function ContentDetail({ content, isLoading = false }: ContentDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
        <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <article className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {content.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {content.author && (
            <Link
              href={`/authors/${content.author.id}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              {content.author.profileImage && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={content.author.profileImage}
                    alt={content.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="font-medium">{content.author.name}</span>
              </div>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <time dateTime={content.createdAt}>{formatDate(content.createdAt)}</time>
          </div>
          {content.viewCount !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{content.viewCount} views</span>
            </div>
          )}
        </div>

        {/* Categories and Tags */}
        <div className="flex flex-wrap gap-2">
          {content.categories &&
            content.categories.map((category) => (
              <Link
                key={category.id}
                href={`?category=${category.slug}`}
                className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {category.name}
              </Link>
            ))}
        </div>
      </header>

      {/* Cover Image */}
      {content.coverImage && (
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={content.coverImage}
            alt={content.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {content.content ? (
          <div dangerouslySetInnerHTML={{ __html: content.content }} />
        ) : (
          <p className="text-muted-foreground">Content not available.</p>
        )}
      </div>

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`?tag=${tag.slug}`}
                className="px-3 py-1 text-sm rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Author Bio Card */}
      {content.author && (
        <Card className="p-6">
          <div className="flex gap-4">
            {content.author.profileImage && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={content.author.profileImage}
                  alt={content.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {content.author.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">Author</p>
              <Link
                href={`/authors/${content.author.id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all posts by this author →
              </Link>
            </div>
          </div>
        </Card>
      )}
    </article>
  );
}
