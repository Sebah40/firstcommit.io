import { GuideCard } from "./guide-card";
import type { Guide } from "@/types";

interface GuideGridProps {
  guides: Guide[];
}

export function GuideGrid({ guides }: GuideGridProps) {
  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <span className="text-3xl">🚀</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No guides yet
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Be the first to share a guide on building with AI. Your vibecoding journey starts here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {guides.map((guide) => (
        <GuideCard key={guide.id} guide={guide} />
      ))}
    </div>
  );
}
