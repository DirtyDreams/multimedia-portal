"use client";

import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface ContentData {
  month: string;
  articles: number;
  blogPosts: number;
  wikiPages: number;
  stories: number;
}

export function ContentOverviewChart() {
  const { data, isLoading } = useQuery<ContentData[]>({
    queryKey: ["content-overview"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // Mock data for last 6 months
      return [
        { month: "Jul", articles: 12, blogPosts: 8, wikiPages: 15, stories: 5 },
        { month: "Aug", articles: 15, blogPosts: 10, wikiPages: 18, stories: 7 },
        { month: "Sep", articles: 18, blogPosts: 12, wikiPages: 22, stories: 6 },
        { month: "Oct", articles: 14, blogPosts: 9, wikiPages: 20, stories: 8 },
        { month: "Nov", articles: 20, blogPosts: 15, wikiPages: 25, stories: 10 },
        { month: "Dec", articles: 22, blogPosts: 18, wikiPages: 28, stories: 12 },
      ];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="articles"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Articles"
        />
        <Line
          type="monotone"
          dataKey="blogPosts"
          stroke="#10b981"
          strokeWidth={2}
          name="Blog Posts"
        />
        <Line
          type="monotone"
          dataKey="wikiPages"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Wiki Pages"
        />
        <Line
          type="monotone"
          dataKey="stories"
          stroke="#f59e0b"
          strokeWidth={2}
          name="Stories"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
