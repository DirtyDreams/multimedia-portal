"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { StarRating } from "./star-rating";
import { RatableType, CreateRatingData } from "@/types/rating";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

interface RatingWidgetProps {
  contentType: RatableType;
  contentId: string;
}

interface RatingStats {
  average: number;
  total: number;
}

interface UserRating {
  id: string;
  value: number;
}

export function RatingWidget({ contentType, contentId }: RatingWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [tempRating, setTempRating] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch average rating stats
  const { data: stats } = useQuery<RatingStats>({
    queryKey: ["rating-stats", contentType, contentId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/ratings/content/${contentType}/${contentId}/average`
      );

      if (!response.ok) {
        // If no ratings exist yet, return default
        if (response.status === 404) {
          return { average: 0, total: 0 };
        }
        throw new Error("Failed to fetch rating stats");
      }

      return response.json();
    },
  });

  // Fetch user's rating if authenticated
  const { data: userRating } = useQuery<UserRating | null>({
    queryKey: ["user-rating", contentType, contentId, user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user) return null;

      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_URL}/ratings/user/${contentType}/${contentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch user rating");
      }

      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Set temp rating when user rating loads
  useEffect(() => {
    if (userRating) {
      setTempRating(userRating.value);
    }
  }, [userRating]);

  // Submit/update rating mutation
  const submitRating = useMutation({
    mutationFn: async (rating: number) => {
      const token = localStorage.getItem("accessToken");

      const ratingData: CreateRatingData = {
        value: rating,
        contentType,
        contentId,
      };

      const response = await fetch(`${API_URL}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit rating");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["rating-stats", contentType, contentId] });
      queryClient.invalidateQueries({ queryKey: ["user-rating", contentType, contentId] });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const handleRatingChange = (rating: number) => {
    setTempRating(rating);
    if (isAuthenticated) {
      submitRating.mutate(rating);
    }
  };

  const average = stats?.average || 0;
  const total = stats?.total || 0;

  return (
    <div className="border-t border-b border-border py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Rating</h3>
          </div>

          {/* Average Rating Display */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <StarRating value={average} readonly size="md" />
                <span className="text-2xl font-bold">{average > 0 ? average.toFixed(1) : "—"}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {total} {total === 1 ? "rating" : "ratings"}
              </p>
            </div>
          </div>

          {/* User Rating Input */}
          {isAuthenticated ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {userRating ? "Your rating:" : "Rate this content:"}
              </p>
              <div className="flex items-center gap-3">
                <StarRating
                  value={tempRating}
                  onChange={handleRatingChange}
                  size="lg"
                  disabled={submitRating.isPending}
                />
                {submitRating.isPending && (
                  <span className="text-sm text-muted-foreground">Saving...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <a href="/login" className="text-primary hover:underline">
                  Log in
                </a>{" "}
                to rate this content
              </p>
            </div>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <p className="text-sm text-green-600 dark:text-green-400">
                  Rating saved successfully!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {submitRating.isError && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500">
                {submitRating.error instanceof Error
                  ? submitRating.error.message
                  : "Failed to save rating"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
