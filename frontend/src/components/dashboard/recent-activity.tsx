"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, User, Image, BookOpen } from "lucide-react";
import { formatDistance } from "date-fns";

interface Activity {
  id: string;
  type: "article" | "comment" | "user" | "gallery" | "blog";
  action: string;
  user: string;
  timestamp: Date;
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const now = new Date();
      return [
        {
          id: "1",
          type: "article",
          action: "published a new article",
          user: "John Doe",
          timestamp: new Date(now.getTime() - 5 * 60000),
        },
        {
          id: "2",
          type: "comment",
          action: "commented on an article",
          user: "Jane Smith",
          timestamp: new Date(now.getTime() - 15 * 60000),
        },
        {
          id: "3",
          type: "user",
          action: "registered a new account",
          user: "Bob Wilson",
          timestamp: new Date(now.getTime() - 30 * 60000),
        },
        {
          id: "4",
          type: "gallery",
          action: "uploaded 5 new images",
          user: "Alice Brown",
          timestamp: new Date(now.getTime() - 45 * 60000),
        },
        {
          id: "5",
          type: "blog",
          action: "published a blog post",
          user: "Charlie Davis",
          timestamp: new Date(now.getTime() - 60 * 60000),
        },
      ];
    },
  });

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "article":
        return FileText;
      case "comment":
        return MessageSquare;
      case "user":
        return User;
      case "gallery":
        return Image;
      case "blog":
        return BookOpen;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading activity...</div>;
  }

  return (
    <div className="space-y-4">
      {activities?.map((activity) => {
        const Icon = getIcon(activity.type);
        return (
          <div key={activity.id} className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistance(activity.timestamp, new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
