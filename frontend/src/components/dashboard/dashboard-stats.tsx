"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, BookOpen, BookMarked, Image, Users, MessageSquare, Eye, TrendingUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatsCard({ title, value, icon: Icon, trend, isLoading }: StatsCardProps) {
  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
            <TrendingUp className={`h-4 w-4 ${!trend.isPositive && "rotate-180"}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">
          {isLoading ? "..." : typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

interface DashboardStats {
  articles: number;
  blogPosts: number;
  wikiPages: number;
  stories: number;
  galleryItems: number;
  users: number;
  comments: number;
  totalViews: number;
}

export function DashboardStats() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint when available
      // For now, return mock data
      return {
        articles: 156,
        blogPosts: 89,
        wikiPages: 234,
        stories: 67,
        galleryItems: 445,
        users: 1234,
        comments: 3456,
        totalViews: 45678,
      };
    },
  });

  const cards = [
    {
      title: "Total Articles",
      value: stats?.articles || 0,
      icon: FileText,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Blog Posts",
      value: stats?.blogPosts || 0,
      icon: BookOpen,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Wiki Pages",
      value: stats?.wikiPages || 0,
      icon: BookMarked,
      trend: { value: 15, isPositive: true },
    },
    {
      title: "Gallery Items",
      value: stats?.galleryItems || 0,
      icon: Image,
      trend: { value: 5, isPositive: false },
    },
    {
      title: "Total Users",
      value: stats?.users || 0,
      icon: Users,
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Comments",
      value: stats?.comments || 0,
      icon: MessageSquare,
      trend: { value: 7, isPositive: true },
    },
    {
      title: "Stories",
      value: stats?.stories || 0,
      icon: BookMarked,
    },
    {
      title: "Total Views",
      value: stats?.totalViews || 0,
      icon: Eye,
      trend: { value: 34, isPositive: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatsCard
          key={card.title}
          {...card}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
