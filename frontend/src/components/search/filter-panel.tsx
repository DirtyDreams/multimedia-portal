"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, X, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface FilterPanelProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export interface SearchFilters {
  categoryIds: string[];
  tagIds: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy: "relevance" | "date" | "title";
  sortOrder: "asc" | "desc";
}

export function FilterPanel({ onFiltersChange, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters || {
      categoryIds: [],
      tagIds: [],
      sortBy: "relevance",
      sortOrder: "desc",
    }
  );

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    tags: true,
    date: false,
    sort: true,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch categories
  const { data: categoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch tags
  const { data: tagsData } = useQuery<{ data: Tag[] }>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/tags`);
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });

  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const toggleTag = (tagId: string) => {
    setFilters((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categoryIds: [],
      tagIds: [],
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "relevance",
      sortOrder: "desc",
    });
  };

  const removeFilter = (type: "category" | "tag", id: string) => {
    if (type === "category") {
      setFilters((prev) => ({
        ...prev,
        categoryIds: prev.categoryIds.filter((cid) => cid !== id),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        tagIds: prev.tagIds.filter((tid) => tid !== id),
      }));
    }
  };

  const hasActiveFilters =
    filters.categoryIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.categoryIds.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId);
            return (
              <button
                key={categoryId}
                onClick={() => removeFilter("category", categoryId)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition"
              >
                <span>{category?.name || categoryId}</span>
                <X className="h-3 w-3" />
              </button>
            );
          })}
          {filters.tagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return (
              <button
                key={tagId}
                onClick={() => removeFilter("tag", tagId)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition"
              >
                <span>{tag?.name || tagId}</span>
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Sort Section */}
      <div className="border-b border-border pb-4 mb-4">
        <button
          onClick={() => toggleSection("sort")}
          className="w-full flex items-center justify-between mb-3 text-sm font-medium"
        >
          <span>Sort By</span>
          {expandedSections.sort ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.sort && (
          <div className="space-y-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as "relevance" | "date" | "title",
                }))
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: e.target.value as "asc" | "desc",
                }))
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="border-b border-border pb-4 mb-4">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between mb-3 text-sm font-medium"
        >
          <span>Categories</span>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.categories && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">No categories available</p>
            ) : (
              categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={filters.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="border-b border-border pb-4 mb-4">
        <button
          onClick={() => toggleSection("tags")}
          className="w-full flex items-center justify-between mb-3 text-sm font-medium"
        >
          <span>Tags</span>
          {expandedSections.tags ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.tags && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags available</p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={filters.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Date Range Section */}
      <div>
        <button
          onClick={() => toggleSection("date")}
          className="w-full flex items-center justify-between mb-3 text-sm font-medium"
        >
          <span>Date Range</span>
          {expandedSections.date ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.date && (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateTo: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
