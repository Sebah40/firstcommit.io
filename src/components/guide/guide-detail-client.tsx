"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaGallery } from "@/components/guide/media-gallery";
import { GuideActions } from "@/components/guide/guide-actions";
import { AuthorCard } from "@/components/guide/author-card";
import { Recommendations } from "@/components/guide/recommendations";
import { ChatTimeline } from "@/components/timeline/chat-timeline";
import { CommentSection } from "@/components/comments/comment-section";
import {
  checkLikeStatus,
  checkSaveStatus,
  checkFollowStatus,
} from "@/lib/supabase/queries/guide-detail";
import { formatRelativeTime } from "@/lib/utils";
import type { GuideDetail, Comment, Guide } from "@/types";
import type { User } from "@supabase/supabase-js";

interface GuideDetailClientProps {
  guide: GuideDetail;
  initialComments: Comment[];
  recommended: Guide[];
  user: User | null;
  userProfile?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export function GuideDetailClient({
  guide: initialGuide,
  initialComments,
  recommended,
  user,
  userProfile,
}: GuideDetailClientProps) {
  const [guide, setGuide] = useState<GuideDetail>(initialGuide);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);

  const isOwner = !!user && user.id === guide.user_id;

  // Fetch user-specific status once component mounts
  useEffect(() => {
    if (!user) return;

    async function loadStatus() {
      const [likeStatus, saveStatus, followStatus] = await Promise.all([
        checkLikeStatus(guide.id, user!.id),
        checkSaveStatus(guide.id, user!.id),
        guide.profile && guide.user_id !== user!.id
          ? checkFollowStatus(user!.id, guide.user_id)
          : Promise.resolve(false),
      ]);

      setLiked(likeStatus);
      setSaved(saveStatus);
      setFollowing(followStatus);
    }

    loadStatus();
  }, [guide.id, guide.user_id, guide.profile, user]);

  const handleGuideUpdated = useCallback((updated: GuideDetail) => {
    setGuide(updated);
  }, []);

  const handleGuideDeleted = useCallback(() => {
    // Navigation handled by GuideActions
  }, []);

  return (
    <div>
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left column */}
        <div className="min-w-0 flex-1">
          {/* Media */}
          {guide.media && guide.media.length > 0 && (
            <div className="mb-6">
              <MediaGallery media={guide.media} />
            </div>
          )}

          {/* Title + meta */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-foreground">{guide.title}</h1>
            {guide.description && (
              <p className="mb-3 text-sm text-muted-foreground">{guide.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {guide.techs.length > 0 &&
                guide.techs.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              {guide.category && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {guide.category.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(guide.created_at)}
              </span>
            </div>
          </div>

          {/* Mobile: author card + actions */}
          <div className="mb-6 flex flex-col gap-4 lg:hidden">
            {guide.profile && (
              <AuthorCard
                author={guide.profile}
                currentUserId={user?.id}
                initialFollowing={following}
              />
            )}
            <GuideActions
              guideId={guide.id}
              userId={user?.id}
              initialLiked={liked}
              initialSaved={saved}
              likesCount={guide.likes_count}
              savesCount={guide.saves_count}
              isOwner={isOwner}
              guide={guide}
              onGuideUpdated={handleGuideUpdated}
              onGuideDeleted={handleGuideDeleted}
            />
          </div>

          {/* Chat timeline */}
          {guide.chat_messages && guide.chat_messages.length > 0 && (
            <div className="mb-8">
              <ChatTimeline
                messages={guide.chat_messages}
                chapters={guide.timeline_chapters}
                isOwner={isOwner}
                postId={guide.id}
              />
            </div>
          )}

          {/* Comments */}
          <CommentSection
            postId={guide.id}
            initialComments={initialComments}
            userId={user?.id}
            userUsername={userProfile?.username}
            userAvatarUrl={userProfile?.avatar_url}
          />
        </div>

        {/* Right column (desktop sidebar) */}
        <div className="hidden w-80 flex-shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-5">
            {guide.profile && (
              <AuthorCard
                author={guide.profile}
                currentUserId={user?.id}
                initialFollowing={following}
              />
            )}
            <GuideActions
              guideId={guide.id}
              userId={user?.id}
              initialLiked={liked}
              initialSaved={saved}
              likesCount={guide.likes_count}
              savesCount={guide.saves_count}
              isOwner={isOwner}
              guide={guide}
              onGuideUpdated={handleGuideUpdated}
              onGuideDeleted={handleGuideDeleted}
            />
            <Recommendations guides={recommended} />
          </div>
        </div>
      </div>

      {/* Mobile recommendations */}
      {recommended.length > 0 && (
        <div className="mt-8 lg:hidden">
          <Recommendations guides={recommended} />
        </div>
      )}
    </div>
  );
}
