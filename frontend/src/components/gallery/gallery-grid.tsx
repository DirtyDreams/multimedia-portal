"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { GalleryItem } from "./gallery-item";
import { Lightbox } from "./lightbox";
import { Loader2 } from "lucide-react";

interface GalleryItemData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  thumbnail?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  categories?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
}

interface GalleryResponse {
  data: GalleryItemData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function GalleryGrid() {
  const limit = 12;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<GalleryResponse>({
    queryKey: ["gallery-infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/gallery-items?page=${pageParam}&limit=${limit}&status=PUBLISHED`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch gallery items");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      }
    );

    const currentRef = loadMoreRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handleNavigateLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  if (status === "pending") {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">
          Failed to load gallery items: {error?.message}
        </p>
      </div>
    );
  }

  const allItems = data?.pages.flatMap((page) => page.data) ?? [];

  if (allItems.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No gallery items found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Grid Layout with Lazy-Loaded Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allItems.map((item, index) => (
            <GalleryItem
              key={`${item.id}-${index}`}
              item={item}
              onClick={() => handleOpenLightbox(index)}
            />
          ))}
        </div>

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <div className="text-muted-foreground text-sm">
            Scroll for more
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            No more items to load
          </div>
        )}
      </div>

      {/* Loading Indicator (initial fetch) */}
      {isFetching && !isFetchingNextPage && (
        <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating gallery...</span>
          </div>
        </div>
      )}
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={handleCloseLightbox}
        items={allItems}
        currentIndex={lightboxIndex}
        onNavigate={handleNavigateLightbox}
      />
    </>
  );
}
