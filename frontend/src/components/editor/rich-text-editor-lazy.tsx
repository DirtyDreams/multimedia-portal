"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import for RichTextEditor (heavy TipTap library)
export const RichTextEditorLazy = dynamic(
  () => import("./rich-text-editor").then((mod) => ({ default: mod.RichTextEditor })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12 border border-border rounded-lg bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
      </div>
    ),
    ssr: false, // TipTap doesn't work with SSR
  }
);
