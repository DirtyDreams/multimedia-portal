import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles | Multimedia Portal",
  description: "Browse our collection of articles",
};

export default function ArticlesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Articles</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Discover our comprehensive collection of articles covering various topics.
      </p>

      {/* ContentList component will be added here */}
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">Loading articles...</p>
      </div>
    </div>
  );
}
