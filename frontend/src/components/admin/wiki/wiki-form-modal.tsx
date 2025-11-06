"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  parent: {
    id: string;
    title: string;
  } | null;
  author: {
    id: string;
    name: string;
  };
  status: "draft" | "published" | "archived";
  children?: WikiPage[];
}

interface WikiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: WikiPage | null;
  allPages: WikiPage[];
}

interface WikiFormData {
  title: string;
  slug: string;
  content: string;
  parentId: string;
  status: "draft" | "published" | "archived";
}

export function WikiFormModal({ isOpen, onClose, page, allPages }: WikiFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WikiFormData>({
    title: "",
    slug: "",
    content: "",
    parentId: "",
    status: "draft",
  });

  // Flatten pages for parent selection (excluding current page and its descendants)
  const flattenPages = (pages: WikiPage[], exclude?: string): WikiPage[] => {
    const result: WikiPage[] = [];
    const flatten = (pageList: WikiPage[]) => {
      pageList.forEach((p) => {
        if (p.id !== exclude) {
          result.push(p);
          if (p.children) {
            flatten(p.children);
          }
        }
      });
    };
    flatten(pages);
    return result;
  };

  const availableParentPages = flattenPages(allPages, page?.id);

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content || "",
        parentId: page.parent?.id || "",
        status: page.status,
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        parentId: "",
        status: "draft",
      });
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async (data: WikiFormData) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages"] });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {page ? "Edit Wiki Page" : "Create New Wiki Page"}
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
              placeholder="Enter wiki page title"
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
              placeholder="page-url-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-generated from title, but you can customize it
            </p>
          </div>

          {/* Parent Page */}
          <div>
            <label className="block text-sm font-medium mb-2">Parent Page</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None (Root Level)</option>
              {availableParentPages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Select a parent page to create a hierarchical structure
            </p>
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-destructive">*</span>
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your wiki page content here..."
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
              {page ? "Update Page" : "Create Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
