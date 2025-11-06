"use client";

import { Clock, X, Trash2 } from "lucide-react";
import { SearchHistoryItem } from "@/hooks/use-search-history";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistory({
  history,
  onSelect,
  onRemove,
  onClearAll,
}: SearchHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No search history yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Searches</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="h-auto py-1 px-2 text-xs hover:text-red-500"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      </div>

      <div className="py-2 max-h-80 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={`${item.query}-${item.timestamp}`}
            className="group flex items-center justify-between px-4 py-2 hover:bg-muted transition cursor-pointer"
            onClick={() => onSelect(item.query)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.query}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(new Date(item.timestamp), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.query);
              }}
              className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-background rounded transition"
              aria-label="Remove from history"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
