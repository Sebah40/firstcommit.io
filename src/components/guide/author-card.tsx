"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Github, Linkedin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatNumber, formatJoinDate } from "@/lib/utils";
import { toggleFollow } from "@/lib/supabase/queries/guide-detail";
import type { Profile } from "@/types";

interface AuthorCardProps {
  author: Profile;
  currentUserId?: string | null;
  initialFollowing: boolean;
}

export function AuthorCard({ author, currentUserId, initialFollowing }: AuthorCardProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(author.followers_count);

  const isOwner = currentUserId === author.id;

  async function handleFollow() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowersCount((c) => (wasFollowing ? c - 1 : c + 1));
    await toggleFollow(currentUserId, author.id, wasFollowing);
  }

  return (
    <div className="rounded-xl bg-surface p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${author.username}`}>
          <Avatar
            userId={author.id}
            username={author.username}
            avatarUrl={author.avatar_url}
            size="lg"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${author.username}`}
            className="block text-sm font-semibold text-foreground hover:underline"
          >
            {author.display_name || author.username}
          </Link>
          <Link
            href={`/profile/${author.username}`}
            className="text-xs text-muted-foreground"
          >
            @{author.username}
          </Link>
        </div>
      </div>

      {author.bio && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{author.bio}</p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{formatNumber(followersCount)} followers</span>
        <span>{formatNumber(author.karma)} karma</span>
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatJoinDate(author.created_at)}
        </span>
      </div>

      {(author.github_url || author.linkedin_url) && (
        <div className="mt-3 flex items-center gap-2">
          {author.github_url && (
            <a
              href={author.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github size={16} />
              GitHub
            </a>
          )}
          {author.linkedin_url && (
            <a
              href={author.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
          )}
        </div>
      )}

      {!isOwner && (
        <button
          onClick={handleFollow}
          className={cn(
            "mt-4 w-full rounded-full py-2 text-sm font-medium transition-colors",
            following
              ? "bg-muted text-foreground hover:bg-surface-hover"
              : "bg-accent text-accent-foreground hover:opacity-90"
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
