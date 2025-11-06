"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  disabled?: boolean;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showValue = false,
  disabled = false,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const starSize = sizeClasses[size];
  const displayRating = hoveredRating !== null ? hoveredRating : value;

  const handleClick = (rating: number) => {
    if (!readonly && !disabled && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly && !disabled) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly && !disabled) {
      setHoveredRating(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayRating;
          const isHovered = hoveredRating !== null && rating <= hoveredRating;

          return (
            <motion.button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly || disabled}
              whileHover={!readonly && !disabled ? { scale: 1.1 } : {}}
              whileTap={!readonly && !disabled ? { scale: 0.95 } : {}}
              className={`${
                readonly || disabled ? "cursor-default" : "cursor-pointer"
              } transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded`}
              aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  isFilled
                    ? isHovered
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-yellow-500 text-yellow-500"
                    : isHovered
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                } ${disabled ? "opacity-50" : ""}`}
              />
            </motion.button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "No rating"}
        </span>
      )}
    </div>
  );
}
