import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <FileQuestion className="h-24 w-24 mx-auto text-zinc-400" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Page Not Found
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Browse Blog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
