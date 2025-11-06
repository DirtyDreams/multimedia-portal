"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, Mail, User } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { AuthorFormModal } from "@/components/admin/authors/author-form-modal";
import { format } from "date-fns";

interface Author {
  id: string;
  name: string;
  slug: string;
  email: string;
  bio: string;
  avatar: string | null;
  website: string | null;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  contentCount: {
    articles: number;
    blogPosts: number;
    stories: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function AuthorsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const queryClient = useQueryClient();

  const { data: authors, isLoading } = useQuery<Author[]>({
    queryKey: ["authors"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          name: "John Doe",
          slug: "john-doe",
          email: "john@example.com",
          bio: "Senior developer and tech writer with 10+ years of experience",
          avatar: "https://ui-avatars.com/api/?name=John+Doe",
          website: "https://johndoe.com",
          social: {
            twitter: "@johndoe",
            linkedin: "johndoe",
            github: "johndoe",
          },
          contentCount: {
            articles: 45,
            blogPosts: 23,
            stories: 12,
          },
          createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          name: "Jane Smith",
          slug: "jane-smith",
          email: "jane@example.com",
          bio: "Full-stack developer passionate about web technologies",
          avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
          website: null,
          social: {
            twitter: "@janesmith",
            github: "janesmith",
          },
          contentCount: {
            articles: 32,
            blogPosts: 18,
            stories: 8,
          },
          createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const deleteAuthorMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this author? This will affect all their content.")) {
      await deleteAuthorMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingAuthor(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAuthor(null);
  };

  const columns: ColumnDef<Author>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
      cell: ({ row }) => {
        const author = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{author.name}</div>
              <div className="text-xs text-muted-foreground truncate">{author.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "bio",
      header: "Bio",
      cell: ({ row }) => (
        <div className="max-w-[300px] text-sm text-muted-foreground line-clamp-2">
          {row.original.bio || "-"}
        </div>
      ),
    },
    {
      accessorKey: "contentCount",
      header: "Content",
      cell: ({ row }) => {
        const { articles, blogPosts, stories } = row.original.contentCount;
        const total = articles + blogPosts + stories;
        return (
          <div>
            <div className="font-medium">{total} items</div>
            <div className="text-xs text-muted-foreground">
              {articles}A · {blogPosts}B · {stories}S
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => {
        const website = row.original.website;
        return website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm truncate block max-w-[150px]"
          >
            {website.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => format(row.original.createdAt, "MMM d, yyyy"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const author = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(author)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(author.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={`/authors/${author.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="View Profile"
            >
              <Eye className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${author.email}`}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold mb-2">Authors</h1>
          <p className="text-muted-foreground">Manage content authors and their profiles</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Author
        </button>
      </div>

      <DataTable columns={columns} data={authors || []} isLoading={isLoading} />

      <AuthorFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        author={editingAuthor}
      />
    </div>
  );
}
