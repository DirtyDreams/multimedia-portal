"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface TrendingSearch {
  query: string;
  count: number;
}

export function TrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearch[]>([]);

  useEffect(() => {
    // Get trending searches from localStorage
    // In a real implementation, this would come from an API endpoint
    const loadTrendingSearches = () => {
      try {
        const history = localStorage.getItem("searchHistory");
        if (!history) {
          setTrending([]);
          return;
        }

        const searches = JSON.parse(history) as Array<{ query: string; timestamp: number }>;

        // Count frequency of each search query
        const queryCounts = searches.reduce((acc, item) => {
          const query = item.query.toLowerCase();
          acc[query] = (acc[query] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by count
        const trendingArray = Object.entries(queryCounts)
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5

        setTrending(trendingArray);
      } catch (error) {
        console.error("Failed to load trending searches:", error);
        setTrending([]);
      }
    };

    loadTrendingSearches();

    // Update trending searches when storage changes
    const handleStorageChange = () => {
      loadTrendingSearches();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Trending Searches</h3>
      </div>

      <div className="space-y-2">
        {trending.map((item, index) => (
          <Link
            key={item.query}
            href={`/search?q=${encodeURIComponent(item.query)}`}
            className="block p-2 hover:bg-muted rounded transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-5">
                  {index + 1}
                </span>
                <span className="text-sm group-hover:text-primary transition">
                  {item.query}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {item.count} {item.count === 1 ? "search" : "searches"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Based on your search history
        </p>
      </div>
    </div>
  );
}
