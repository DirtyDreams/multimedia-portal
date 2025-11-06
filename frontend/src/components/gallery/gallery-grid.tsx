"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GalleryItem } from "./gallery-item";
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
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, error } = useQuery<GalleryResponse>({
    queryKey: ["gallery", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/gallery-items?page=${page}&limit=${limit}&status=PUBLISHED`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch gallery items");
      }

      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Failed to load gallery items</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No gallery items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.data.map((item) => (
          <GalleryItem key={item.id} item={item} />
        ))}
      </div>

      {/* Pagination */}
      {data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
          >
            Previous
          </button>
          <span className="px-4 py-2 flex items-center">
            Page {page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
