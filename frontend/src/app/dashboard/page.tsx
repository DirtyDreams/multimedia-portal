import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Dashboard - Multimedia Portal Admin",
  description: "Admin dashboard for managing content",
};

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
        {/* Dashboard content will be added in Task 32.2 */}
        <div className="grid gap-6">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p className="text-muted-foreground">
              Use the sidebar to navigate between different sections of the admin panel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Articles</div>
              <div className="text-2xl font-bold">--</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Blog Posts</div>
              <div className="text-2xl font-bold">--</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Wiki Pages</div>
              <div className="text-2xl font-bold">--</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Users</div>
              <div className="text-2xl font-bold">--</div>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
