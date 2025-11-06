"use client";

import { useState, useEffect } from "react";

const SEARCH_HISTORY_KEY = "searchHistory";
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [history]);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      // Remove duplicates (case-insensitive)
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new item at the beginning
      const newHistory = [
        { query: query.trim(), timestamp: Date.now() },
        ...filtered,
      ];

      // Limit to MAX_HISTORY_ITEMS
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (query: string) => {
    setHistory((prev) =>
      prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase())
    );
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
