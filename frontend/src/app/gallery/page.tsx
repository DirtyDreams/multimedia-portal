"use client";

import { useState, useCallback } from "react";
import { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { GalleryFilters } from "@/components/gallery/gallery-filters";

export default function GalleryPage() {
  const [filters, setFilters] = useState<{
    search: string;
    categoryId: string | null;
    tagIds: string[];
  }>({
    search: "",
    categoryId: null,
    tagIds: [],
  });

  const handleFiltersChange = useCallback((newFilters: {
    search: string;
    categoryId: string | null;
    tagIds: string[];
  }) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Gallery</h1>
        <p className="text-lg text-muted-foreground">
          Explore our collection of images and videos
        </p>
      </div>

      {/* Filters */}
      <GalleryFilters onFiltersChange={handleFiltersChange} />

      {/* Gallery Grid */}
      <GalleryGrid filters={filters} />
    </div>
  );
}
