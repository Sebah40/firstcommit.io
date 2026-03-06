"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Terminal, MessageSquare, FileCode, Users, BookOpen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTechColor } from "@/lib/utils/tech-icons";
import { useTranslation } from "@/lib/i18n/use-translation";
import { motion } from "framer-motion";
import type { Guide } from "@/types";

interface HomeSidebarProps {
  guides: Guide[];
  activeTech?: string;
}

export function HomeSidebar({ guides, activeTech }: HomeSidebarProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Compute platform stats
  const totalStories = guides.length;
  const totalMessages = guides.reduce((s, g) => s + (g.message_count || 0), 0);
  const totalFiles = guides.reduce((s, g) => s + (g.files_changed || 0), 0);
  const uniqueAuthors = new Set(guides.map((g) => g.user_id).filter(Boolean)).size;

  // Compute tech frequencies
  const techCounts = new Map<string, number>();
  for (const g of guides) {
    for (const tech of g.techs) {
      techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
    }
  }
  const topTechs = [...techCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  function handleTechClick(tech: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTech === tech) {
      params.delete("tech");
    } else {
      params.set("tech", tech);
    }
    const qs = params.toString();
    window.location.href = qs ? `/?${qs}` : "/";
  }

  // Top post by likes
  const topPost = [...guides].sort((a, b) => b.likes_count - a.likes_count)[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Platform Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl bg-surface border border-border/40 p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          {t("sidebar.platformStats")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{totalStories}</p>
              <p className="text-[10px] text-muted-foreground">{t("sidebar.stories")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageSquare size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{totalMessages.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t("sidebar.prompts")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileCode size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{totalFiles.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t("sidebar.filesChanged")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Users size={14} className="text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{uniqueAuthors}</p>
              <p className="text-[10px] text-muted-foreground">{t("sidebar.authors")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tech Filter */}
      {topTechs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl bg-surface border border-border/40 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {t("sidebar.filterByTech")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {topTechs.map(([tech, count]) => (
              <button
                key={tech}
                onClick={() => handleTechClick(tech)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
                  activeTech === tech
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: getTechColor(tech) }}
                />
                {tech}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Most Popular Post */}
      {topPost && topPost.likes_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-xl bg-surface border border-border/40 p-4"
        >
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <TrendingUp size={14} className="text-accent" />
            {t("sidebar.mostPopular")}
          </div>
          <Link
            href={`/guide/${topPost.id}`}
            className="group block"
          >
            <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {topPost.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              @{topPost.profile?.username ?? "anonymous"} · {topPost.likes_count} likes
            </p>
          </Link>
        </motion.div>
      )}

      {/* Publish CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <Terminal size={14} className="text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("sidebar.publishCta")}
          </h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
          {t("sidebar.publishCtaDesc")}
        </p>
        <Link
          href="/connect"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
        >
          <Terminal size={14} />
          {t("sidebar.getStarted")}
        </Link>
      </motion.div>
    </div>
  );
}
