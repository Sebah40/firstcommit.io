"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        Try again
      </button>
    </div>
  );
}
