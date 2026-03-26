"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Guide page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold text-foreground">
        Could not load guide
      </h2>
      <p className="max-w-md text-muted-foreground">
        There was a problem loading this guide. It may have been removed or is temporarily unavailable.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full bg-muted px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          Browse guides
        </Link>
      </div>
    </div>
  );
}
