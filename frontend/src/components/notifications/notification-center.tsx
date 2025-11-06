"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Settings, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "comment" | "like" | "reply" | "mention" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useSocket();
  const toast = useToast();

  // Socket.io event listeners for real-time notifications
  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (notification: Notification) => {
      // Add notification to the list
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return [notification];
        return [notification, ...old];
      });

      // Show toast notification
      const toastMessage = notification.message.substring(0, 100);
      switch (notification.type) {
        case "comment":
          toast.info(toastMessage, notification.title);
          break;
        case "like":
          toast.success(toastMessage, notification.title);
          break;
        case "reply":
          toast.info(toastMessage, notification.title);
          break;
        case "mention":
          toast.warning(toastMessage, notification.title);
          break;
        case "system":
          toast.info(toastMessage, notification.title);
          break;
      }
    };

    const handleNotificationRead = (notificationId: string) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return [];
        return old.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
      });
    };

    const handleNotificationDeleted = (notificationId: string) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) => {
        if (!old) return [];
        return old.filter((n) => n.id !== notificationId);
      });
    };

    // Register event listeners
    on("notification:new", handleNewNotification);
    on("notification:read", handleNotificationRead);
    on("notification:deleted", handleNotificationDeleted);

    // Cleanup on unmount
    return () => {
      off("notification:new", handleNewNotification);
      off("notification:read", handleNotificationRead);
      off("notification:deleted", handleNotificationDeleted);
    };
  }, [isConnected, on, off, queryClient, toast]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          type: "comment" as const,
          title: "New comment on your article",
          message: "John Doe commented on 'Getting Started with Next.js 14'",
          read: false,
          link: "/dashboard/articles/1",
          createdAt: new Date(now.getTime() - 5 * 60 * 1000),
        },
        {
          id: "2",
          type: "like" as const,
          title: "Someone liked your post",
          message: "Jane Smith liked your blog post 'Understanding TypeScript'",
          read: false,
          link: "/dashboard/blog/2",
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
        {
          id: "3",
          type: "reply" as const,
          title: "New reply to your comment",
          message: "Bob replied to your comment on 'Building Scalable APIs'",
          read: true,
          link: "/dashboard/articles/3",
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          id: "4",
          type: "system" as const,
          title: "System update",
          message: "New features available in the admin panel",
          read: true,
          link: "/dashboard",
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      ];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const filteredNotifications = notifications?.filter((n) =>
    filter === "unread" ? !n.read : true
  ) || [];

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    const icons = {
      comment: "💬",
      like: "❤️",
      reply: "↩️",
      mention: "👤",
      system: "⚙️",
    };
    return icons[type];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <Link
                href="/dashboard/notifications/settings"
                className="p-1.5 hover:bg-muted rounded-lg transition"
                title="Notification Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All ({notifications?.length || 0})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  filter === "unread"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border hover:bg-muted/50 transition group ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-1.5 hover:bg-background rounded transition"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1.5 hover:bg-background rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Link */}
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                          onClick={() => setIsOpen(false)}
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/30">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
