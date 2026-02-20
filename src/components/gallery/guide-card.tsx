"use client";

import Link from "next/link";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber, formatRelativeTime, guideDetailPath } from "@/lib/utils";
import type { Guide } from "@/types";

interface GuideCardProps {
  guide: Guide;
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link href={guideDetailPath(guide.id, guide.title)} className="group block">
      <article className="overflow-hidden rounded-xl bg-surface transition-transform duration-200 hover:scale-[1.02]">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          {guide.media && guide.media.length > 0 ? (
            <img
              src={guide.media[0].url}
              alt={guide.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
              <span className="text-3xl font-bold text-accent/60">
                {guide.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Tech badges */}
          {guide.techs.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {guide.techs.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {tech}
                </span>
              ))}
              {guide.techs.length > 3 && (
                <span className="rounded-md bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                  +{guide.techs.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-1 py-3">
          {/* Author + time */}
          <div className="mb-1.5 flex items-center gap-2">
            <Avatar
              userId={guide.user_id}
              username={guide.profile?.username ?? "?"}
              avatarUrl={guide.profile?.avatar_url}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {guide.profile?.username ?? "anonymous"}
            </span>
            <span className="text-xs text-muted-foreground/40">&middot;</span>
            <span className="text-xs text-muted-foreground/60">
              {formatRelativeTime(guide.created_at)}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground">
            {guide.title}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart size={13} />
              {formatNumber(guide.likes_count)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} />
              {formatNumber(guide.comments_count)}
            </span>
            <span className="ml-auto">
              <Bookmark size={13} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
