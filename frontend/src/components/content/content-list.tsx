"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, User, Eye } from "lucide-react";
import { Content, ContentFilters, ContentType } from "@/types/content";
import { cn } from "@/lib/utils";

interface ContentListProps {
  items: Content[];
  contentType: ContentType;
  total?: number;
  page?: number;
  limit?: number;
  onFilterChange?: (filters: ContentFilters) => void;
  isLoading?: boolean;
}

export function ContentList({
  items,
  contentType,
  total = 0,
  page = 1,
  limit = 10,
  onFilterChange,
  isLoading = false,
}: ContentListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ContentFilters>({ page, limit });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search, page: 1 };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const getContentPath = (slug: string) => {
    const paths: Record<ContentType, string> = {
      article: "/articles",
      blogPost: "/blog",
      wikiPage: "/wiki",
      galleryItem: "/gallery",
      story: "/stories",
    };
    return `${paths[contentType]}/${slug}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Content Items */}
      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">No content found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={getContentPath(item.slug)}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden">
                {item.coverImage && (
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {item.excerpt}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {item.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{item.author.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    {item.viewCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{item.viewCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show first page, last page, current page, and pages around current
              const shouldShow =
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1);

              if (!shouldShow) {
                // Show ellipsis
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <span key={pageNum} className="px-2 py-1">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(page === pageNum && "pointer-events-none")}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      {total > 0 && (
        <p className="text-sm text-center text-muted-foreground">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
          {total} results
        </p>
      )}
    </div>
  );
}
