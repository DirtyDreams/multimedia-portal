"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { StoryFormModal } from "@/components/admin/stories/story-form-modal";
import { format } from "date-fns";

interface Story {
  id: string;
  title: string;
  slug: string;
  author: {
    id: string;
    name: string;
  };
  series: string | null;
  chapter: number | null;
  status: "draft" | "published" | "archived";
  categories: string[];
  publishedAt: Date | null;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function StoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const queryClient = useQueryClient();

  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ["stories"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          title: "The Chronicles Begin",
          slug: "chronicles-begin",
          author: { id: "1", name: "John Doe" },
          series: "The Chronicles",
          chapter: 1,
          status: "published" as const,
          categories: ["Fantasy", "Adventure"],
          publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          views: 3456,
          likes: 234,
          createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          title: "A New Hope",
          slug: "new-hope",
          author: { id: "2", name: "Jane Smith" },
          series: "The Chronicles",
          chapter: 2,
          status: "published" as const,
          categories: ["Fantasy", "Adventure"],
          publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          views: 2891,
          likes: 187,
          createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          title: "The Standalone Tale",
          slug: "standalone-tale",
          author: { id: "1", name: "John Doe" },
          series: null,
          chapter: null,
          status: "draft" as const,
          categories: ["Mystery"],
          publishedAt: null,
          views: 0,
          likes: 0,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      await deleteStoryMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingStory(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStory(null);
  };

  const columns: ColumnDef<Story>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const story = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{story.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {story.series && story.chapter
                ? `${story.series} - Chapter ${story.chapter}`
                : story.slug}
            </div>
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
      accessorKey: "series",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Series" />,
      cell: ({ row }) => {
        const story = row.original;
        return story.series ? (
          <div>
            <div className="font-medium">{story.series}</div>
            {story.chapter && (
              <div className="text-xs text-muted-foreground">Chapter {story.chapter}</div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Standalone</span>
        );
      },
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
        <div className="flex flex-wrap gap-1 max-w-[150px]">
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
      accessorKey: "views",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
      cell: ({ row }) => row.original.views.toLocaleString(),
    },
    {
      accessorKey: "likes",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Likes" />,
      cell: ({ row }) => row.original.likes.toLocaleString(),
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const story = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(story)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(story.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/stories/${story.slug}`}
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
          <h1 className="text-3xl font-bold mb-2">Stories</h1>
          <p className="text-muted-foreground">Manage your stories and series</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Story
        </button>
      </div>

      <DataTable columns={columns} data={stories || []} isLoading={isLoading} />

      <StoryFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        story={editingStory}
      />
    </div>
  );
}
