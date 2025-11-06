"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RatingWidgetProps {
  contentId: string;
  initialRating?: number;
  totalRatings?: number;
  averageRating?: number;
  userRating?: number;
  onRate?: (rating: number) => Promise<void>;
  readonly?: boolean;
}

export function RatingWidget({
  contentId,
  initialRating = 0,
  totalRatings = 0,
  averageRating = 0,
  userRating,
  onRate,
  readonly = false,
}: RatingWidgetProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(userRating || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (readonly || !onRate) return;

    setIsSubmitting(true);
    try {
      await onRate(rating);
      setCurrentRating(rating);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || currentRating;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Rate this content</h3>
          <p className="text-sm text-muted-foreground">
            {totalRatings > 0
              ? `Average: ${averageRating.toFixed(1)} / 5.0 (${totalRatings} ${
                  totalRatings === 1 ? "rating" : "ratings"
                })`
              : "Be the first to rate this content"}
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex gap-1",
              !readonly && "cursor-pointer"
            )}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
          >
            {[1, 2, 3, 4, 5].map((rating) => {
              const isFilled = rating <= displayRating;
              return (
                <button
                  key={rating}
                  type="button"
                  disabled={readonly || isSubmitting}
                  onClick={() => handleRate(rating)}
                  onMouseEnter={() => !readonly && setHoveredRating(rating)}
                  className={cn(
                    "transition-all",
                    !readonly && "hover:scale-110",
                    readonly && "cursor-default"
                  )}
                  aria-label={`Rate ${rating} stars`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isFilled
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-zinc-300 dark:text-zinc-600"
                    )}
                  />
                </button>
              );
            })}
          </div>
          {displayRating > 0 && (
            <span className="text-sm font-medium">{displayRating}/5</span>
          )}
        </div>

        {/* User Feedback */}
        {currentRating > 0 && !readonly && (
          <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm">
              You rated this content {currentRating} star{currentRating !== 1 ? "s" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRate(0)}
              disabled={isSubmitting}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Rating Breakdown (Optional) */}
        {totalRatings > 0 && (
          <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-medium mb-3">Rating Distribution</p>
            {[5, 4, 3, 2, 1].map((stars) => {
              // Mock data - in real app, this would come from API
              const percentage = Math.random() * 100;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs w-8">{stars}★</span>
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
