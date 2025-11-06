"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { GalleryFilters } from "@/components/gallery/gallery-filters";
import { UploadModal } from "@/components/gallery/upload-modal";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function GalleryPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    search: string;
    categoryId: string | null;
    tagIds: string[];
  }>({
    search: "",
    categoryId: null,
    tagIds: [],
  });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleFiltersChange = useCallback((newFilters: {
    search: string;
    categoryId: string | null;
    tagIds: string[];
  }) => {
    setFilters(newFilters);
  }, []);

  const handleUploadComplete = () => {
    // Invalidate gallery queries to refetch with new items
    queryClient.invalidateQueries({ queryKey: ["gallery-infinite"] });
  };

  // Check if user is admin or moderator
  const canUpload = isAuthenticated && user && (user.role === "admin" || user.role === "moderator");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">Gallery</h1>

          {/* Upload Button - Only for Admin/Moderator */}
          {canUpload && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          )}
        </div>
        <p className="text-lg text-muted-foreground">
          Explore our collection of images and videos
        </p>
      </div>

      {/* Filters */}
      <GalleryFilters onFiltersChange={handleFiltersChange} />

      {/* Gallery Grid */}
      <GalleryGrid filters={filters} />

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
