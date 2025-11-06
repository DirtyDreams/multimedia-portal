"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Loader2, Upload, Image as ImageIcon } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
  thumbnail: string;
  categories: string[];
  tags: string[];
}

interface GalleryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
}

interface GalleryFormData {
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
  thumbnail: string;
  categories: string[];
  tags: string[];
}

export function GalleryFormModal({ isOpen, onClose, item }: GalleryFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<GalleryFormData>({
    title: "",
    description: "",
    type: "image",
    url: "",
    thumbnail: "",
    categories: [],
    tags: [],
  });

  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // Fetch available categories
  const { data: availableCategories } = useQuery<string[]>({
    queryKey: ["gallery-categories"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return ["Nature", "Landscapes", "Urban", "Photography", "Videos", "Products"];
    },
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail,
        categories: item.categories || [],
        tags: item.tags || [],
      });
      setPreviewUrl(item.thumbnail);
    } else {
      setFormData({
        title: "",
        description: "",
        type: "image",
        url: "",
        thumbnail: "",
        categories: [],
        tags: [],
      });
      setPreviewUrl("");
    }
  }, [item]);

  const saveMutation = useMutation({
    mutationFn: async (data: GalleryFormData) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to server
      // For now, create a local preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData({
        ...formData,
        url: url,
        thumbnail: url,
        title: formData.title || file.name.replace(/\.[^/.]+$/, ""),
      });
    }
  };

  const handleAddCategory = (category: string) => {
    if (category && !formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== category),
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {item ? "Edit Gallery Item" : "Upload New Media"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Media File <span className="text-destructive">*</span>
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl("");
                      setFormData({ ...formData, url: "", thumbnail: "" });
                    }}
                    className="text-sm text-destructive hover:underline"
                  >
                    Remove and upload different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your image or video, or
                    </p>
                    <label className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                      Browse Files
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPEG, PNG, GIF, MP4, WebM
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "image" | "video",
                })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter media title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Brief description of the media"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="flex gap-2 mb-2">
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {availableCategories?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAddCategory(categoryInput)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.categories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted text-foreground rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {item ? "Update Media" : "Upload Media"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
