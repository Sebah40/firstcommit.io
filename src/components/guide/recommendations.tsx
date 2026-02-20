import { RecommendationCard } from "./recommendation-card";
import type { Guide } from "@/types";

interface RecommendationsProps {
  guides: Guide[];
}

export function Recommendations({ guides }: RecommendationsProps) {
  if (guides.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">More like this</h3>
      <div className="flex flex-col gap-1">
        {guides.map((guide) => (
          <RecommendationCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}
