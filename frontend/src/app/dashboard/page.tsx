"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { DashboardStats } from "@/components/dashboard";

// Dynamic imports for chart components (heavy Recharts library)
const ContentOverviewChart = dynamic(
  () => import("@/components/dashboard/content-overview-chart").then((mod) => ({ default: mod.ContentOverviewChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

const ContentDistributionChart = dynamic(
  () => import("@/components/dashboard/content-distribution-chart").then((mod) => ({ default: mod.ContentDistributionChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

const RecentActivity = dynamic(
  () => import("@/components/dashboard/recent-activity").then((mod) => ({ default: mod.RecentActivity })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  }
);


export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Multimedia Portal admin panel
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <div className="space-y-6">
          {/* Statistics Cards */}
          <DashboardStats />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Overview Chart */}
            <div className="p-6 bg-card border border-border rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Content Overview</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Content creation over the last 6 months
              </p>
              <ContentOverviewChart />
            </div>

            {/* Content Distribution Chart */}
            <div className="p-6 bg-card border border-border rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Content Distribution</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Distribution by content type
              </p>
              <ContentDistributionChart />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Latest actions in the system
            </p>
            <RecentActivity />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
