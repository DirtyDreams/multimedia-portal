"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

interface Story {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  author: {
    id: string;
    name: string;
  };
  series: string | null;
  chapter: number | null;
  status: "draft" | "published" | "archived";
  categories: string[];
  tags?: string[];
  publishedAt: Date | null;
}

interface StoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
}

interface StoryFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  series: string;
  chapter: string;
  status: "draft" | "published" | "archived";
  categories: string[];
  tags: string[];
}

export function StoryFormModal({ isOpen, onClose, story }: StoryFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    series: "",
    chapter: "",
    status: "draft",
    categories: [],
    tags: [],
  });

  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Fetch available categories and series
  const { data: availableCategories } = useQuery<string[]>({
    queryKey: ["story-categories"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return ["Fantasy", "Adventure", "Mystery", "Sci-Fi", "Romance", "Thriller"];
    },
  });

  const { data: availableSeries } = useQuery<string[]>({
    queryKey: ["story-series"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return ["The Chronicles", "Space Odyssey", "Mystery Tales"];
    },
  });

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title,
        slug: story.slug,
        content: story.content || "",
        excerpt: story.excerpt || "",
        series: story.series || "",
        chapter: story.chapter?.toString() || "",
        status: story.status,
        categories: story.categories || [],
        tags: story.tags || [],
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        series: "",
        chapter: "",
        status: "draft",
        categories: [],
        tags: [],
      });
    }
  }, [story]);

  const saveMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, title, slug });
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
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {story ? "Edit Story" : "Create New Story"}
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter story title"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="story-url-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-generated from title, but you can customize it
            </p>
          </div>

          {/* Series and Chapter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Series (Optional)</label>
              <input
                type="text"
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter series name"
                list="series-list"
              />
              <datalist id="series-list">
                {availableSeries?.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for standalone story
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chapter Number</label>
              <input
                type="number"
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "draft" | "published" | "archived",
                })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
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

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Brief description of the story"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-destructive">*</span>
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your story content here..."
            />
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
              {story ? "Update Story" : "Create Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
