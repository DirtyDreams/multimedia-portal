import { Suspense } from "react";
import { SearchResultsClient } from "./search-results-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Search Results - Multimedia Portal",
  description: "Search articles, blog posts, wiki pages, gallery items, and stories",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <SearchResultsClient />
    </Suspense>
  );
}
