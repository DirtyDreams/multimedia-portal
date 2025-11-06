"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { ArticleFormModal } from "@/components/admin/articles/article-form-modal";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  slug: string;
  author: {
    id: string;
    name: string;
  };
  status: "draft" | "published" | "archived";
  categories: string[];
  publishedAt: Date | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function ArticlesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          title: "Getting Started with Next.js 14",
          slug: "getting-started-nextjs-14",
          author: { id: "1", name: "John Doe" },
          status: "published" as const,
          categories: ["Technology", "Web Development"],
          publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          views: 1245,
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          title: "Understanding TypeScript Generics",
          slug: "understanding-typescript-generics",
          author: { id: "2", name: "Jane Smith" },
          status: "published" as const,
          categories: ["Technology", "TypeScript"],
          publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          views: 892,
          createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          title: "Building Scalable APIs with NestJS",
          slug: "building-scalable-apis-nestjs",
          author: { id: "1", name: "John Doe" },
          status: "draft" as const,
          categories: ["Technology", "Backend"],
          publishedAt: null,
          views: 0,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      await deleteArticleMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingArticle(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingArticle(null);
  };

  const columns: ColumnDef<Article>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const article = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{article.title}</div>
            <div className="text-xs text-muted-foreground truncate">{article.slug}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "author",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
      cell: ({ row }) => row.original.author.name,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          archived: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "categories",
      header: "Categories",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.categories.slice(0, 2).map((category, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
            >
              {category}
            </span>
          ))}
          {row.original.categories.length > 2 && (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
              +{row.original.categories.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
      cell: ({ row }) => {
        const date = row.original.publishedAt;
        return date ? format(date, "MMM d, yyyy") : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "views",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
      cell: ({ row }) => row.original.views.toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const article = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(article)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(article.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/articles/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </a>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Articles</h1>
          <p className="text-muted-foreground">Manage your articles and publications</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Article
        </button>
      </div>

      <DataTable columns={columns} data={articles || []} isLoading={isLoading} />

      <ArticleFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        article={editingArticle}
      />
    </div>
  );
}
