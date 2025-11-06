"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentTypeFilter } from "@/types/search";

interface Author {
  id: string;
  name: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdvancedSearchForm {
  exactPhrase: string;
  anyWords: string;
  allWords: string;
  authorId: string;
  dateFrom: string;
  dateTo: string;
  contentTypes: ContentTypeFilter[];
}

export function AdvancedSearchModal({ isOpen, onClose }: AdvancedSearchModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<AdvancedSearchForm>({
    exactPhrase: "",
    anyWords: "",
    allWords: "",
    authorId: "",
    dateFrom: "",
    dateTo: "",
    contentTypes: [],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch authors
  const { data: authorsData } = useQuery<{ data: Author[] }>({
    queryKey: ["authors"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/authors`);
      if (!response.ok) throw new Error("Failed to fetch authors");
      return response.json();
    },
    enabled: isOpen,
  });

  const authors = authorsData?.data || [];

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const toggleContentType = (type: ContentTypeFilter) => {
    setForm((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter((t) => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  const buildSearchQuery = (): string => {
    const parts: string[] = [];

    // Exact phrase - wrap in quotes
    if (form.exactPhrase.trim()) {
      parts.push(`"${form.exactPhrase.trim()}"`);
    }

    // All words - each word must appear
    if (form.allWords.trim()) {
      const words = form.allWords.trim().split(/\s+/);
      parts.push(...words);
    }

    // Any words - at least one word must appear
    if (form.anyWords.trim()) {
      const words = form.anyWords.trim().split(/\s+/);
      if (words.length > 0) {
        parts.push(`(${words.join(" OR ")})`);
      }
    }

    return parts.join(" ");
  };

  const handleSearch = () => {
    const query = buildSearchQuery();

    if (!query.trim() && !form.authorId && !form.dateFrom && !form.dateTo && form.contentTypes.length === 0) {
      return; // No search criteria provided
    }

    // Build URL params
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query);
    } else {
      params.set("q", "*"); // Wildcard search if no text query
    }

    if (form.authorId) {
      params.set("authorId", form.authorId);
    }

    if (form.dateFrom) {
      params.set("dateFrom", form.dateFrom);
    }

    if (form.dateTo) {
      params.set("dateTo", form.dateTo);
    }

    form.contentTypes.forEach((type) => {
      params.append("contentTypes", type);
    });

    // Navigate to search results
    router.push(`/search?${params.toString()}`);
    onClose();
  };

  const handleSaveSearch = () => {
    const query = buildSearchQuery();
    const searchData = {
      query,
      ...form,
      timestamp: Date.now(),
    };

    // Get saved searches from localStorage
    const saved = localStorage.getItem("savedSearches");
    const savedSearches = saved ? JSON.parse(saved) : [];

    // Add new search (limit to 10)
    savedSearches.unshift(searchData);
    localStorage.setItem("savedSearches", JSON.stringify(savedSearches.slice(0, 10)));

    alert("Search saved successfully!");
  };

  const handleReset = () => {
    setForm({
      exactPhrase: "",
      anyWords: "",
      allWords: "",
      authorId: "",
      dateFrom: "",
      dateTo: "",
      contentTypes: [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Exact Phrase */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Exact phrase
            </label>
            <input
              type="text"
              value={form.exactPhrase}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, exactPhrase: e.target.value }))
              }
              placeholder='e.g., "artificial intelligence"'
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find results with this exact phrase
            </p>
          </div>

          {/* All of these words */}
          <div>
            <label className="block text-sm font-medium mb-2">
              All of these words
            </label>
            <input
              type="text"
              value={form.allWords}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, allWords: e.target.value }))
              }
              placeholder="e.g., tutorial guide beginner"
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Results must contain all of these words
            </p>
          </div>

          {/* Any of these words */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Any of these words
            </label>
            <input
              type="text"
              value={form.anyWords}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, anyWords: e.target.value }))
              }
              placeholder="e.g., javascript typescript python"
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Results must contain at least one of these words
            </p>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <select
              value={form.authorId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, authorId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Any author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                From date
              </label>
              <input
                type="date"
                value={form.dateFrom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To date</label>
              <input
                type="date"
                value={form.dateTo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Content types
            </label>
            <div className="space-y-2">
              {Object.values(ContentTypeFilter).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={form.contentTypes.includes(type)}
                    onChange={() => toggleContentType(type)}
                    className="rounded border-input"
                  />
                  <span className="text-sm capitalize">
                    {type.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={handleSaveSearch}>
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
