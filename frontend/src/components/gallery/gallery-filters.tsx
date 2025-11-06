"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface GalleryFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    categoryId: string | null;
    tagIds: string[];
  }) => void;
}

export function GalleryFilters({ onFiltersChange }: GalleryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories from API
  const { data: categoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/categories`
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch tags from API
  const { data: tagsData } = useQuery<{ data: Tag[] }>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/tags`
      );
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });

  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange({
      search: searchQuery,
      categoryId: selectedCategory,
      tagIds: selectedTags,
    });
  }, [searchQuery, selectedCategory, selectedTags, onFiltersChange]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTags.length > 0;

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-card rounded-lg border border-border space-y-4">
          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Categories</h3>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories available</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Tags</h3>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      selectedTags.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
              {categories.find((c) => c.id === selectedCategory)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              />
            </span>
          )}
          {selectedTags.map((tagId) => (
            <span
              key={tagId}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
            >
              {tags.find((t) => t.id === tagId)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagToggle(tagId)}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
