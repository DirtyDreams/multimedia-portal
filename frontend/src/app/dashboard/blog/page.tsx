"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { BlogFormModal } from "@/components/admin/blog/blog-form-modal";
import { format } from "date-fns";

interface BlogPost {
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
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function BlogPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          title: "10 Tips for Better Code Reviews",
          slug: "10-tips-better-code-reviews",
          author: { id: "1", name: "John Doe" },
          status: "published" as const,
          categories: ["Development", "Best Practices"],
          publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          views: 2341,
          comments: 45,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          title: "My Journey into Web Development",
          slug: "my-journey-web-development",
          author: { id: "2", name: "Jane Smith" },
          status: "published" as const,
          categories: ["Personal", "Career"],
          publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          views: 1567,
          comments: 23,
          createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          title: "Understanding React Server Components",
          slug: "understanding-react-server-components",
          author: { id: "1", name: "John Doe" },
          status: "draft" as const,
          categories: ["React", "Technology"],
          publishedAt: null,
          views: 0,
          comments: 0,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      await deletePostMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  const columns: ColumnDef<BlogPost>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{post.title}</div>
            <div className="text-xs text-muted-foreground truncate">{post.slug}</div>
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
      accessorKey: "comments",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comments" />,
      cell: ({ row }) => row.original.comments.toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(post)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/blog/${post.slug}`}
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
          <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts and updates</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Post
        </button>
      </div>

      <DataTable columns={columns} data={posts || []} isLoading={isLoading} />

      <BlogFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        post={editingPost}
      />
    </div>
  );
}
