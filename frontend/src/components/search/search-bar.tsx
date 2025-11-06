"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteResult } from "@/types/search";

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Search articles, blog posts, wiki...",
  autoFocus = false,
  onSearch,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Debounce query for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch autocomplete suggestions
  const { data: suggestions, isLoading } = useQuery<AutocompleteResult[]>({
    queryKey: ["autocomplete", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];

      const response = await fetch(
        `${API_URL}/search/autocomplete?q=${encodeURIComponent(debouncedQuery)}&limit=8`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setIsOpen(false);
      setQuery("");

      if (onSearch) {
        onSearch(searchQuery);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    },
    [onSearch, router]
  );

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions && suggestions[selectedIndex]) {
      handleSuggestionClick(suggestions[selectedIndex]);
    } else {
      handleSearch(query);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: AutocompleteResult) => {
    const contentTypePaths: Record<string, string> = {
      article: "articles",
      blogPost: "blog",
      wikiPage: "wiki",
      galleryItem: "gallery",
      story: "stories",
    };

    const path = contentTypePaths[suggestion.contentType] || "search";
    router.push(`/${path}/${suggestion.slug}`);
    setIsOpen(false);
    setQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown when there are suggestions
  useEffect(() => {
    if (suggestions && suggestions.length > 0 && query.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [suggestions, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery]);

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

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search Icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-10 pr-10 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
          />

          {/* Loading/Clear Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 hover:bg-muted rounded transition"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-muted transition flex items-center justify-between ${
                    selectedIndex === index ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{suggestion.title}</p>
                  </div>
                  <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded flex-shrink-0">
                    {getContentTypeLabel(suggestion.contentType)}
                  </span>
                </button>
              ))}
            </div>

            {/* View All Results Link */}
            <div className="border-t border-border px-4 py-3 bg-muted/50">
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-primary hover:underline"
              >
                View all results for "{query}"
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
