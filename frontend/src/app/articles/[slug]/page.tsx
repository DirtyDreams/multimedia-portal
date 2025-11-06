import { Metadata } from "next";
import { notFound } from "next/navigation";

interface ArticleDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  return {
    title: `${params.slug} | Articles | Multimedia Portal`,
    description: "Read our detailed article",
  };
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        {/* ContentDetail component will be added here */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold mb-4">Article: {slug}</h1>
          <p className="text-muted-foreground">Loading article content...</p>
        </div>

        {/* RatingWidget will be added here */}
        <div className="mt-8">
          <p className="text-muted-foreground">Rating widget coming soon...</p>
        </div>

        {/* CommentSection will be added here */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <p className="text-muted-foreground">Comment section coming soon...</p>
        </div>
      </article>
    </div>
  );
}
