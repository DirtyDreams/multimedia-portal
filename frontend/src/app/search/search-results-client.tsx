"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, User, Loader2, Filter } from "lucide-react";
import { SearchResponse, SearchResult, ContentTypeFilter } from "@/types/search";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistance } from "date-fns";

export function SearchResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [page, setPage] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter | "">("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [query, contentTypeFilter]);

  // Fetch search results
  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["search", query, page, contentTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("q", query);
      params.append("page", page.toString());
      params.append("limit", "10");

      if (contentTypeFilter) {
        params.append("contentType", contentTypeFilter);
      }

      const response = await fetch(`${API_URL}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      return response.json();
    },
    enabled: query.length >= 2,
  });

  const getContentTypeLabel = (contentType: string) => {
    const labels: Record<string, string> = {
      article: "Article",
      blogPost: "Blog Post",
      wikiPage: "Wiki",
      galleryItem: "Gallery",
      story: "Story",
    };
    return labels[contentType] || contentType;
  };

  const getContentTypePath = (contentType: string) => {
    const paths: Record<string, string> = {
      article: "articles",
      blogPost: "blog",
      wikiPage: "wiki",
      galleryItem: "gallery",
      story: "stories",
    };
    return paths[contentType] || "search";
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const results = data?.hits || [];
  const total = data?.estimatedTotalHits || 0;
  const searchTime = data?.processingTimeMs ? data.processingTimeMs / 1000 : 0;
  const totalPages = Math.ceil(total / 10);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPages = 7;

    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (page > 3) {
      pages.push("...");
    }

    // Show pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (query.length < 2) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Search the Portal</h1>
          <p className="text-muted-foreground">
            Enter at least 2 characters to start searching
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          {!isLoading && (
            <p className="text-muted-foreground">
              Found {total.toLocaleString()} result{total !== 1 ? "s" : ""} in{" "}
              {searchTime.toFixed(2)}s
            </p>
          )}
        </div>

        {/* Content Type Filter */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Filter by type:</span>
          <Button
            variant={contentTypeFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter("")}
          >
            All
          </Button>
          <Button
            variant={contentTypeFilter === ContentTypeFilter.ARTICLE ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter(ContentTypeFilter.ARTICLE)}
          >
            Articles
          </Button>
          <Button
            variant={contentTypeFilter === ContentTypeFilter.BLOG_POST ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter(ContentTypeFilter.BLOG_POST)}
          >
            Blog Posts
          </Button>
          <Button
            variant={contentTypeFilter === ContentTypeFilter.WIKI_PAGE ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter(ContentTypeFilter.WIKI_PAGE)}
          >
            Wiki
          </Button>
          <Button
            variant={contentTypeFilter === ContentTypeFilter.GALLERY_ITEM ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter(ContentTypeFilter.GALLERY_ITEM)}
          >
            Gallery
          </Button>
          <Button
            variant={contentTypeFilter === ContentTypeFilter.STORY ? "default" : "outline"}
            size="sm"
            onClick={() => setContentTypeFilter(ContentTypeFilter.STORY)}
          >
            Stories
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">
              Failed to load search results. Please try again.
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-4">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && !error && results.length > 0 && (
          <>
            <div className="space-y-6 mb-8">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/${getContentTypePath(result.contentType)}/${result.slug}`}
                  className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold group-hover:text-primary transition flex-1">
                      {result.title}
                    </h2>
                    <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded flex-shrink-0">
                      {getContentTypeLabel(result.contentType)}
                    </span>
                  </div>

                  {result.excerpt && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {result.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {result.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{result.author.name}</span>
                      </div>
                    )}
                    {result.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDistance(new Date(result.publishedAt), new Date(), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                    {result.score !== undefined && (
                      <span className="text-xs">
                        Relevance: {Math.round(result.score * 100)}%
                      </span>
                    )}
                  </div>

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {result.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-muted text-xs rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{result.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                {getPageNumbers().map((pageNum, index) =>
                  pageNum === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
