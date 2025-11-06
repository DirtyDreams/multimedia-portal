"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Upload, User } from "lucide-react";

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
}

interface AuthorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: Author | null;
}

interface AuthorFormData {
  name: string;
  slug: string;
  email: string;
  bio: string;
  avatar: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
}

export function AuthorFormModal({ isOpen, onClose, author }: AuthorFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AuthorFormData>({
    name: "",
    slug: "",
    email: "",
    bio: "",
    avatar: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (author) {
      setFormData({
        name: author.name,
        slug: author.slug,
        email: author.email,
        bio: author.bio,
        avatar: author.avatar || "",
        website: author.website || "",
        twitter: author.social.twitter || "",
        linkedin: author.social.linkedin || "",
        github: author.social.github || "",
      });
      setAvatarPreview(author.avatar || "");
    } else {
      setFormData({
        name: "",
        slug: "",
        email: "",
        bio: "",
        avatar: "",
        website: "",
        twitter: "",
        linkedin: "",
        github: "",
      });
      setAvatarPreview("");
    }
  }, [author]);

  const saveMutation = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, name, slug });
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
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {author ? "Edit Author" : "Create New Author"}
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
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter author name"
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
              placeholder="author-url-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-generated from name, but you can customize it
            </p>
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
              placeholder="author@example.com"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
              placeholder="Brief biography of the author"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com"
            />
          </div>

          {/* Social Media */}
          <div>
            <label className="block text-sm font-medium mb-3">Social Media</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Twitter</label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">GitHub</label>
                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="username"
                />
              </div>
            </div>
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
              {author ? "Update Author" : "Create Author"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
