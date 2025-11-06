"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface GalleryItemProps {
  item: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    thumbnail?: string;
    author: {
      id: string;
      name: string;
    };
  };
  onClick?: () => void;
}

export function GalleryItem({ item, onClick }: GalleryItemProps) {
  const isVideo = item.fileType === "video";
  const imageUrl = item.thumbnail || item.fileUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-lg bg-card shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image/Video Thumbnail */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Video Play Icon Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-primary" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Overlay with Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {item.title}
            </h3>
            <p className="text-xs text-gray-300">by {item.author.name}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
