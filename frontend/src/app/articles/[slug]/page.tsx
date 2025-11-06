import { Metadata } from "next";
import { ArticleDetailClient } from "./article-detail-client";

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
  return <ArticleDetailClient slug={params.slug} />;
}
