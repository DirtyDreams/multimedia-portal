"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, Grid, List, Image as ImageIcon, Video } from "lucide-react";
import { GalleryFormModal } from "@/components/admin/gallery/gallery-form-modal";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
  thumbnail: string;
  categories: string[];
  tags: string[];
  views: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

type ViewMode = "grid" | "list";

export default function GalleryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["gallery-items"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          title: "Mountain Landscape",
          description: "Beautiful mountain scenery at sunset",
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
          thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
          categories: ["Nature", "Landscapes"],
          tags: ["mountains", "sunset", "landscape"],
          views: 2341,
          uploadedBy: { id: "1", name: "John Doe" },
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          title: "City Nightlife",
          description: "Urban cityscape with vibrant lights",
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1514565131-fce0801e5785",
          thumbnail: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400",
          categories: ["Urban", "Photography"],
          tags: ["city", "night", "lights"],
          views: 1567,
          uploadedBy: { id: "2", name: "Jane Smith" },
          createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          id: "3",
          title: "Product Demo",
          description: "Product demonstration video",
          type: "video" as const,
          url: "https://example.com/video.mp4",
          thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400",
          categories: ["Videos", "Products"],
          tags: ["demo", "product", "tutorial"],
          views: 892,
          uploadedBy: { id: "1", name: "John Doe" },
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
    },
  });

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gallery item?")) {
      await deleteItemMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const columns: ColumnDef<GalleryItem>[] = [
    {
      accessorKey: "thumbnail",
      header: "Preview",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Video className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="max-w-[250px]">
            <div className="font-medium truncate flex items-center gap-2">
              {item.type === "video" ? (
                <Video className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              {item.title}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {item.description}
            </div>
          </div>
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
      accessorKey: "uploadedBy",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded By" />,
      cell: ({ row }) => row.original.uploadedBy.name,
    },
    {
      accessorKey: "views",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
      cell: ({ row }) => row.original.views.toLocaleString(),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
      cell: ({ row }) => format(row.original.createdAt, "MMM d, yyyy"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(item)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={item.url}
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
          <h1 className="text-3xl font-bold mb-2">Gallery</h1>
          <p className="text-muted-foreground">Manage your images and videos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Upload Media
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading gallery items...
            </div>
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="h-10 w-10 text-white" />
                    </div>
                  )}
                  {/* Actions Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-background/90 hover:bg-background rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-background/90 hover:bg-background text-destructive rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold truncate mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.views.toLocaleString()} views</span>
                    <span>{format(item.createdAt, "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No gallery items found. Upload your first media to get started.
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <DataTable columns={columns} data={items || []} isLoading={isLoading} />
      )}

      <GalleryFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        item={editingItem}
      />
    </div>
  );
}
