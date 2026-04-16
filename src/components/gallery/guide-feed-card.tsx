"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Bookmark, MessageSquare, FileCode, ExternalLink, GitBranch } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber, formatRelativeTime, guideDetailPath } from "@/lib/utils";
import { getTechColor } from "@/lib/utils/tech-icons";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useTranslateTexts } from "@/hooks/use-translate";
import { usePostTranslation } from "@/hooks/use-post-translation";
import type { Guide } from "@/types";

interface GuideFeedCardProps {
    guide: Guide;
    priority?: boolean;
}

export function GuideFeedCard({ guide, priority }: GuideFeedCardProps) {
    const { t } = useTranslation();
    const { title: trTitle, hook_description: trHook } = usePostTranslation(guide.id, {
        title: guide.title,
        hook_description: guide.hook_description ?? "",
    });
    const [trSnippet] = useTranslateTexts([guide.highlight_snippet ?? ""]);

    const bodySnippet = trHook || guide.hook_description || trSnippet || guide.highlight_snippet;

    return (
        <article
            className="group overflow-hidden rounded-xl bg-surface shadow-sm border border-border/40 transition-all duration-300 hover:shadow-md hover:border-accent/40 mb-6"
        >
            <div className="p-4 sm:p-5">
                {/* Header: Author & Time */}
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar
                            userId={guide.user_id ?? "anon"}
                            username={guide.profile?.username ?? "?"}
                            avatarUrl={guide.profile?.avatar_url}
                            size="sm"
                        />
                        <span className="text-sm font-medium text-foreground">
                            {guide.profile?.username ?? "anonymous"}
                        </span>
                        <span className="text-sm text-muted-foreground/40">&middot;</span>
                        <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(guide.created_at)}
                        </span>
                    </div>
                    {/* Tech Badges */}
                    {guide.techs.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
                            {guide.techs.slice(0, 3).map((tech) => (
                                <span
                                    key={tech}
                                    className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                                >
                                    <span
                                        className="inline-block h-1.5 w-1.5 rounded-full"
                                        style={{ backgroundColor: getTechColor(tech) }}
                                    />
                                    {tech}
                                </span>
                            ))}
                            {guide.techs.length > 3 && (
                                <span className="rounded-full bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                                    +{guide.techs.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <Link href={guideDetailPath(guide.id, guide.title)} className="block">
                    {/* Title */}
                    <h2 className="mb-2 text-xl sm:text-2xl font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
                        {trTitle}
                    </h2>

                    {/* Instance URL */}
                    {guide.instance_url && (
                        <div className="mb-3">
                            <span className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                                <ExternalLink size={14} />
                                {guide.instance_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </span>
                        </div>
                    )}

                    {/* Body Snippet */}
                    {bodySnippet && (
                        <div className="mb-4 text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed">
                            {bodySnippet}
                        </div>
                    )}

                    {/* Mobile Tech badges */}
                    {guide.techs.length > 0 && (
                        <div className="flex sm:hidden flex-wrap gap-1.5 mb-4">
                            {guide.techs.slice(0, 3).map((tech) => (
                                <span
                                    key={tech}
                                    className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                                >
                                    <span
                                        className="inline-block h-1.5 w-1.5 rounded-full"
                                        style={{ backgroundColor: getTechColor(tech) }}
                                    />
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </Link>
            </div>

            {/* Media / Image */}
            {guide.media && guide.media.length > 0 && (
                <Link href={guideDetailPath(guide.id, guide.title)} className="block w-full overflow-hidden bg-muted">
                    <Image
                        src={guide.media[0].url}
                        alt={guide.title}
                        width={720}
                        height={400}
                        className="w-full max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        priority={priority}
                        sizes="(max-width: 768px) 100vw, 720px"
                    />
                </Link>
            )}

            {/* Footer Stats / Actions */}
            <div className="flex items-center justify-between border-t border-border/40 p-3 sm:px-5 sm:py-3.5 bg-muted/10">
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group/btn">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full group-hover/btn:bg-accent/10 group-hover/btn:text-accent transition-colors">
                            <Heart size={18} />
                        </div>
                        {formatNumber(guide.likes_count)}
                    </button>

                    <Link href={`${guideDetailPath(guide.id, guide.title)}#comments`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group/btn">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full group-hover/btn:bg-blue-500/10 group-hover/btn:text-blue-500 transition-colors">
                            <MessageCircle size={18} />
                        </div>
                        {formatNumber(guide.comments_count)}
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Build stats */}
                    <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-muted-foreground mr-2 border-r border-border/40 pr-4">
                        {guide.message_count > 0 && (
                            <span className="flex items-center gap-1.5" title={`${guide.message_count} prompts`}>
                                <MessageSquare size={14} />
                                {guide.message_count}
                            </span>
                        )}
                        {guide.files_changed > 0 && (
                            <span className="flex items-center gap-1.5" title={`${guide.files_changed} files changed`}>
                                <FileCode size={14} />
                                {guide.files_changed}
                            </span>
                        )}
                        {(guide as any).stage_count > 0 && (
                            <span className="flex items-center gap-1.5" title={`${(guide as any).stage_count} build stages`}>
                                <GitBranch size={14} />
                                {(guide as any).stage_count} stages
                            </span>
                        )}
                    </div>

                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Bookmark size={18} />
                    </button>
                </div>
            </div>
        </article>
    );
}
