"use client";

import Link from "next/link";
import { Heart, MessageCircle, Bookmark, MessageSquare, FileCode, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber, formatRelativeTime, guideDetailPath } from "@/lib/utils";
import { getTechColor } from "@/lib/utils/tech-icons";
import { useTranslation } from "@/lib/i18n/use-translation";
import { motion } from "framer-motion";
import type { Guide } from "@/types";

interface GuideCardProps {
  guide: Guide;
}

export function GuideCard({ guide }: GuideCardProps) {
  const { t } = useTranslation();

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <Link href={guideDetailPath(guide.id, guide.title)} className="group block">
      <motion.article
        variants={item}
        className="overflow-hidden rounded-xl bg-surface shadow-sm border border-border/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-accent/40"
      >
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

          {/* Tech badges with colored dots */}
          {guide.techs.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {guide.techs.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getTechColor(tech) }}
                  />
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
              userId={guide.user_id ?? "anon"}
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
          <h3 className="mb-1.5 line-clamp-2 text-sm font-medium text-foreground">
            {guide.title}
          </h3>

          {/* Instance URL */}
          {guide.instance_url && (
            <div className="mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-accent">
                <ExternalLink size={10} />
                {guide.instance_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            </div>
          )}

          {/* Conversation stats */}
          {(guide.message_count > 0 || guide.files_changed > 0) && (
            <div className="mb-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              {guide.message_count > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare size={11} />
                  {guide.message_count} {t("common.messages")}
                </span>
              )}
              {guide.files_changed > 0 && (
                <span className="flex items-center gap-1">
                  <FileCode size={11} />
                  {guide.files_changed} {t("common.files")}
                </span>
              )}
            </div>
          )}

          {/* Highlight snippet */}
          {guide.highlight_snippet && (
            <p className="mb-2 line-clamp-2 text-xs italic text-muted-foreground/70">
              &ldquo;{guide.highlight_snippet}&rdquo;
            </p>
          )}

          {/* Engagement stats */}
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
      </motion.article>
    </Link>
  );
}
