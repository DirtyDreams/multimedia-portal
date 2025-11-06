import { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { GalleryFilters } from "@/components/gallery/gallery-filters";

export const metadata: Metadata = {
  title: "Gallery | Multimedia Portal",
  description: "Browse our collection of images and videos",
};

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Gallery</h1>
        <p className="text-lg text-muted-foreground">
          Explore our collection of images and videos
        </p>
      </div>

      {/* Filters */}
      <GalleryFilters />

      {/* Gallery Grid */}
      <GalleryGrid />
    </div>
  );
}
