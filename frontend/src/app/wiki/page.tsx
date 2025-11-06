import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wiki | Multimedia Portal",
  description: "Browse our knowledge base and wiki articles",
};

export default function WikiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Wiki</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Access our comprehensive knowledge base with hierarchically organized information.
      </p>

      {/* ContentList component will be added here */}
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">Loading wiki pages...</p>
      </div>
    </div>
  );
}
