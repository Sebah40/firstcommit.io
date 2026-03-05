import Link from "next/link";
import { formatNumber, formatRelativeTime, guideDetailPath } from "@/lib/utils";
import { Heart } from "lucide-react";
import type { Guide } from "@/types";

interface RecommendationCardProps {
  guide: Guide;
}

export function RecommendationCard({ guide }: RecommendationCardProps) {
  const thumbnail = guide.media?.[0];

  return (
    <Link
      href={guideDetailPath(guide.id, guide.title)}
      className="flex items-center gap-3 rounded-xl glass-card p-2 hover:bg-surface-hover/50 transition-colors group"
    >
      {/* Thumbnail */}
      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail.url}
            alt={guide.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
            <span className="text-xs font-bold text-accent/60">
              {guide.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-1 text-base font-semibold font-serif text-foreground group-hover:text-accent transition-colors">
          {guide.title}
        </h4>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart size={11} />
            {formatNumber(guide.likes_count)}
          </span>
          <span>{formatRelativeTime(guide.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
