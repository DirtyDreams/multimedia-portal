"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Play,
  Pause,
} from "lucide-react";

interface GalleryItemData {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  thumbnail?: string;
  author: {
    id: string;
    name: string;
  };
}

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItemData[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  isOpen,
  onClose,
  items,
  currentIndex,
  onNavigate,
}: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const currentItem = items[currentIndex];

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
    }
  }, [currentIndex, items.length, onNavigate]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    if (!currentItem) return;

    try {
      const response = await fetch(currentItem.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentItem.title}.${currentItem.fileType === "video" ? "mp4" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!currentItem) return null;

  const isVideo = currentItem.fileType === "video";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {currentIndex < items.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-2">
            {!isVideo && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition"
              aria-label="Download"
            >
              <Download className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Content Container */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center"
            >
              {/* Image or Video */}
              {isVideo ? (
                <video
                  src={currentItem.fileUrl}
                  controls
                  autoPlay={isPlaying}
                  className="max-w-full max-h-[80vh] rounded-lg"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div
                  className="relative max-w-full max-h-[80vh] overflow-auto cursor-move"
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <Image
                    src={currentItem.fileUrl}
                    alt={currentItem.title}
                    width={1920}
                    height={1080}
                    className="max-w-full h-auto rounded-lg"
                    priority
                  />
                </div>
              )}

              {/* Info Bar */}
              <div className="mt-4 text-center text-white max-w-2xl">
                <h2 className="text-2xl font-semibold mb-2">
                  {currentItem.title}
                </h2>
                {currentItem.description && (
                  <p className="text-gray-300 mb-2">{currentItem.description}</p>
                )}
                <p className="text-sm text-gray-400">
                  by {currentItem.author.name} • {currentIndex + 1} of{" "}
                  {items.length}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
