"use client";

import { useState } from "react";
import { ContentList } from "@/components/content";
import { useContentList } from "@/hooks/use-content";
import { ContentFilters } from "@/types/content";

export default function BlogPage() {
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 12,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, error } = useContentList("blogPost", filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Explore our latest blog posts and stay up to date with the newest content.
      </p>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-6">
          <p className="font-medium">Failed to load blog posts</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : "An error occurred"}</p>
        </div>
      )}

      <ContentList
        items={data?.data || []}
        contentType="blogPost"
        total={data?.meta.total || 0}
        page={filters.page || 1}
        limit={filters.limit || 12}
        onFilterChange={setFilters}
        isLoading={isLoading}
      />
    </div>
  );
}
