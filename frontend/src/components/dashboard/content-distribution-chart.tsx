"use client";

import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface ContentDistribution {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];

export function ContentDistributionChart() {
  const { data, isLoading } = useQuery<ContentDistribution[]>({
    queryKey: ["content-distribution"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return [
        { name: "Articles", value: 156 },
        { name: "Blog Posts", value: 89 },
        { name: "Wiki Pages", value: 234 },
        { name: "Stories", value: 67 },
        { name: "Gallery", value: 445 },
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
