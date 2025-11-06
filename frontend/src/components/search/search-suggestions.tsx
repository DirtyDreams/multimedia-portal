"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

interface SearchSuggestionsProps {
  query: string;
  resultsCount: number;
}

export function SearchSuggestions({ query, resultsCount }: SearchSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    // Generate suggestions based on common typos and patterns
    // In a real implementation, this would come from MeiliSearch or a dedicated API
    const generateSuggestion = (q: string): string | null => {
      const lower = q.toLowerCase().trim();

      // Common typo corrections
      const corrections: Record<string, string> = {
        "javascirpt": "javascript",
        "pythom": "python",
        "recat": "react",
        "typscript": "typescript",
        "databse": "database",
        "algoritm": "algorithm",
        "progamming": "programming",
        "tutoral": "tutorial",
        "dvelopment": "development",
        "documnetation": "documentation",
      };

      // Check for exact matches in corrections
      if (corrections[lower]) {
        return corrections[lower];
      }

      // Check for partial matches (words in the query)
      const words = lower.split(/\s+/);
      const correctedWords = words.map(word => corrections[word] || word);
      const correctedQuery = correctedWords.join(" ");

      if (correctedQuery !== lower) {
        return correctedQuery;
      }

      // Simple Levenshtein-like suggestion (check if adding/removing one character helps)
      // This is a simplified version - in production, use MeiliSearch typo tolerance
      for (const [typo, correct] of Object.entries(corrections)) {
        if (lower.includes(typo)) {
          return lower.replace(typo, correct);
        }
      }

      return null;
    };

    // Only show suggestions if results are low or zero
    if (resultsCount < 3 && query.length >= 3) {
      const suggestedQuery = generateSuggestion(query);
      if (suggestedQuery && suggestedQuery !== query.toLowerCase()) {
        setSuggestion(suggestedQuery);
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  }, [query, resultsCount]);

  if (!suggestion) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">
            Did you mean:
          </p>
          <Link
            href={`/search?q=${encodeURIComponent(suggestion)}`}
            className="text-lg font-medium text-primary hover:underline"
          >
            {suggestion}
          </Link>
        </div>
      </div>
    </div>
  );
}
