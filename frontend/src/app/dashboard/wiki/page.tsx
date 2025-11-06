"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { WikiFormModal } from "@/components/admin/wiki/wiki-form-modal";
import { format } from "date-fns";

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  parent: {
    id: string;
    title: string;
  } | null;
  author: {
    id: string;
    name: string;
  };
  status: "draft" | "published" | "archived";
  views: number;
  children?: WikiPage[];
  createdAt: Date;
  updatedAt: Date;
}

export default function WikiPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<WikiPage | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery<WikiPage[]>({
    queryKey: ["wiki-pages"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          title: "Getting Started",
          slug: "getting-started",
          parent: null,
          author: { id: "1", name: "John Doe" },
          status: "published" as const,
          views: 1523,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          children: [
            {
              id: "2",
              title: "Installation",
              slug: "getting-started/installation",
              parent: { id: "1", title: "Getting Started" },
              author: { id: "1", name: "John Doe" },
              status: "published" as const,
              views: 892,
              createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            },
            {
              id: "3",
              title: "Configuration",
              slug: "getting-started/configuration",
              parent: { id: "1", title: "Getting Started" },
              author: { id: "2", name: "Jane Smith" },
              status: "published" as const,
              views: 654,
              createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          id: "4",
          title: "API Reference",
          slug: "api-reference",
          parent: null,
          author: { id: "2", name: "Jane Smith" },
          status: "published" as const,
          views: 2341,
          createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          children: [
            {
              id: "5",
              title: "Authentication",
              slug: "api-reference/authentication",
              parent: { id: "4", title: "API Reference" },
              author: { id: "2", name: "Jane Smith" },
              status: "published" as const,
              views: 1234,
              createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          id: "6",
          title: "Advanced Topics",
          slug: "advanced-topics",
          parent: null,
          author: { id: "1", name: "John Doe" },
          status: "draft" as const,
          views: 0,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages"] });
    },
  });

  const handleEdit = (page: WikiPage) => {
    setEditingPage(page);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this wiki page?")) {
      await deletePageMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingPage(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPage(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderPage = (page: WikiPage, level: number = 0) => {
    const isExpanded = expandedPages.has(page.id);
    const hasChildren = page.children && page.children.length > 0;

    const statusColors = {
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };

    return (
      <div key={page.id}>
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 transition"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpanded(page.id)}
            className={`flex-shrink-0 ${hasChildren ? "visible" : "invisible"}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Icon */}
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          {/* Title and Slug */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{page.title}</div>
            <div className="text-xs text-muted-foreground truncate">{page.slug}</div>
          </div>

          {/* Author */}
          <div className="hidden md:block text-sm text-muted-foreground w-32">
            {page.author.name}
          </div>

          {/* Status */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[page.status]}`}
          >
            {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
          </span>

          {/* Views */}
          <div className="hidden lg:block text-sm text-muted-foreground w-20 text-right">
            {page.views.toLocaleString()}
          </div>

          {/* Updated */}
          <div className="hidden xl:block text-sm text-muted-foreground w-32">
            {format(page.updatedAt, "MMM d, yyyy")}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleEdit(page)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(page.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/wiki/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {page.children?.map((child) => renderPage(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wiki Pages</h1>
          <p className="text-muted-foreground">
            Manage your wiki pages with hierarchical structure
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Page
        </button>
      </div>

      {/* Hierarchical Tree View */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border font-medium text-sm">
          <div className="w-4"></div> {/* Spacer for expand button */}
          <div className="w-4"></div> {/* Spacer for icon */}
          <div className="flex-1">Page</div>
          <div className="hidden md:block w-32">Author</div>
          <div>Status</div>
          <div className="hidden lg:block w-20 text-right">Views</div>
          <div className="hidden xl:block w-32">Updated</div>
          <div className="w-28 text-center">Actions</div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Loading wiki pages...
          </div>
        ) : pages && pages.length > 0 ? (
          pages.map((page) => renderPage(page))
        ) : (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No wiki pages found. Create your first page to get started.
          </div>
        )}
      </div>

      <WikiFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        page={editingPage}
        allPages={pages || []}
      />
    </div>
  );
}
