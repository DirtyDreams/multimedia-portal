import { Metadata } from "next";
import { notFound } from "next/navigation";

interface WikiDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: WikiDetailPageProps): Promise<Metadata> {
  return {
    title: `${params.slug} | Wiki | Multimedia Portal`,
    description: "Read our wiki article",
  };
}

export default function WikiDetailPage({ params }: WikiDetailPageProps) {
  const { slug } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Sidebar for wiki navigation */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Wiki Navigation</h3>
            <p className="text-sm text-muted-foreground">
              Hierarchical navigation coming soon...
            </p>
          </div>
        </aside>

        {/* Main content */}
        <article className="flex-1">
          {/* ContentDetail component will be added here */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold mb-4">Wiki: {slug}</h1>
            <p className="text-muted-foreground">Loading wiki page content...</p>
          </div>

          {/* CommentSection will be added here */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Comments</h2>
            <p className="text-muted-foreground">Comment section coming soon...</p>
          </div>
        </article>
      </div>
    </div>
  );
}
