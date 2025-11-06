"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Shield, User as UserIcon, Ban } from "lucide-react";
import Image from "next/image";
import { DataTable, DataTableColumnHeader } from "@/components/table";
import { ColumnDef } from "@tanstack/react-table";
import { UserFormModal } from "@/components/admin/users/user-form-modal";
import { format } from "date-fns";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "banned";
  avatar: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  contentCount: {
    comments: number;
    ratings: number;
  };
}

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          username: "admin_user",
          email: "admin@example.com",
          role: "admin" as const,
          status: "active" as const,
          avatar: "https://ui-avatars.com/api/?name=Admin+User",
          createdAt: new Date(now.getTime() - 500 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          contentCount: {
            comments: 145,
            ratings: 89,
          },
        },
        {
          id: "2",
          username: "moderator_jane",
          email: "jane.mod@example.com",
          role: "moderator" as const,
          status: "active" as const,
          avatar: "https://ui-avatars.com/api/?name=Jane+Moderator",
          createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          contentCount: {
            comments: 234,
            ratings: 156,
          },
        },
        {
          id: "3",
          username: "user_bob",
          email: "bob@example.com",
          role: "user" as const,
          status: "active" as const,
          avatar: null,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          contentCount: {
            comments: 45,
            ratings: 23,
          },
        },
        {
          id: "4",
          username: "suspended_user",
          email: "suspended@example.com",
          role: "user" as const,
          status: "suspended" as const,
          avatar: null,
          createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
          lastLogin: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          contentCount: {
            comments: 12,
            ratings: 8,
          },
        },
      ];
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      await deleteUserMutation.mutateAsync(id);
    }
  };

  const handleCreateNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{user.username}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.original.role;
        const roleColors = {
          admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          moderator: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          user: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        };
        const RoleIcon = role === "admin" ? Shield : role === "moderator" ? Shield : UserIcon;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role]} flex items-center gap-1 w-fit`}>
            <RoleIcon className="h-3 w-3" />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          banned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "contentCount",
      header: "Activity",
      cell: ({ row }) => {
        const { comments, ratings } = row.original.contentCount;
        return (
          <div className="text-sm">
            <div>{comments + ratings} actions</div>
            <div className="text-xs text-muted-foreground">
              {comments}C · {ratings}R
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "lastLogin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => {
        const date = row.original.lastLogin;
        return date ? format(date, "MMM d, yyyy") : <span className="text-muted-foreground">Never</span>;
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
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(user)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New User
        </button>
      </div>

      <DataTable columns={columns} data={users || []} isLoading={isLoading} />

      <UserFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        user={editingUser}
      />
    </div>
  );
}
