"use client";

import Link from "next/link";
import { Terminal, MessageCircle, Heart, Bookmark } from "lucide-react";
import type { ProfileTab } from "@/types";

interface ProfileEmptyStateProps {
  tab: ProfileTab;
  isOwner: boolean;
}

const config: Record<ProfileTab, {
  icon: typeof Terminal;
  ownerTitle: string;
  ownerDesc: string;
  visitorTitle: string;
  visitorDesc: string;
  ctaLabel?: string;
  ctaHref?: string;
}> = {
  guides: {
    icon: Terminal,
    ownerTitle: "Share your first build story",
    ownerDesc: "Connect your AI coding tool and publish a guide showing how you built something — from first commit to production.",
    visitorTitle: "No guides yet",
    visitorDesc: "This developer hasn't published any build stories yet.",
    ctaLabel: "Connect your tool",
    ctaHref: "/connect",
  },
  comments: {
    icon: MessageCircle,
    ownerTitle: "Join the conversation",
    ownerDesc: "Comment on guides to share your thoughts, ask questions, or help other developers.",
    visitorTitle: "No comments yet",
    visitorDesc: "This developer hasn't commented on any guides yet.",
    ctaLabel: "Browse guides",
    ctaHref: "/",
  },
  liked: {
    icon: Heart,
    ownerTitle: "Like guides you enjoy",
    ownerDesc: "When you like a guide, it shows up here. Browse the feed to discover build stories worth hearting.",
    visitorTitle: "No liked guides",
    visitorDesc: "This developer hasn't liked any guides yet.",
    ctaLabel: "Browse guides",
    ctaHref: "/",
  },
  saved: {
    icon: Bookmark,
    ownerTitle: "Save guides for later",
    ownerDesc: "Bookmark guides you want to revisit. They'll be saved here for easy access.",
    visitorTitle: "No saved guides",
    visitorDesc: "This developer hasn't saved any guides yet.",
    ctaLabel: "Browse guides",
    ctaHref: "/",
  },
};

export function ProfileEmptyState({ tab, isOwner }: ProfileEmptyStateProps) {
  const c = config[tab];
  const Icon = c.icon;
  const title = isOwner ? c.ownerTitle : c.visitorTitle;
  const desc = isOwner ? c.ownerDesc : c.visitorDesc;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {isOwner && c.ctaLabel && c.ctaHref && (
        <Link
          href={c.ctaHref}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
        >
          {tab === "guides" && <Terminal size={14} />}
          {c.ctaLabel}
        </Link>
      )}
    </div>
  );
}
