"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, User as UserIcon } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "banned";
  avatar: string | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "banned";
  avatar: string;
}

export function UserFormModal({ isOpen, onClose, user }: UserFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
    avatar: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: "", // Never pre-fill password
        role: user.role,
        status: user.status,
        avatar: user.avatar || "",
      });
      setAvatarPreview(user.avatar || "");
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        status: "active",
        avatar: "",
      });
      setAvatarPreview("");
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to server
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setFormData({ ...formData, avatar: url });
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    setFormData({ ...formData, avatar: url });
    setAvatarPreview(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {user ? "Edit User" : "Create New User"}
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
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-block px-4 py-2 bg-muted text-foreground rounded-lg cursor-pointer hover:bg-muted/80 transition-colors text-sm">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-muted-foreground">or</div>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleAvatarUrlChange(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Enter image URL"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Username <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password {!user && <span className="text-destructive">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={user ? "Leave blank to keep current password" : "Enter password"}
              required={!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to keep the current password
              </p>
            )}
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "admin" | "moderator" | "user",
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "suspended" | "banned",
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          {/* Role Description */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Role Permissions</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><strong>User:</strong> Can comment, rate content, and view all public content</li>
              <li><strong>Moderator:</strong> Can moderate comments and manage content flags</li>
              <li><strong>Admin:</strong> Full access to all features and settings</li>
            </ul>
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
              {user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
