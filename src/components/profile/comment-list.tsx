"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { formatRelativeTime, formatNumber, guideDetailPath } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Comment } from "@/types";

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const { t } = useTranslation();

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {t("comments.noComments")}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("comments.onGuides")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-xl bg-surface p-4">
          {comment.post && (
            <Link
              href={guideDetailPath(comment.post.id, comment.post.title)}
              className="mb-2 block text-sm font-medium text-accent hover:underline"
            >
              {comment.post.title}
            </Link>
          )}
          <p className="text-sm text-foreground">{comment.content}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart size={12} />
              {formatNumber(comment.likes_count)}
            </span>
            <span>{formatRelativeTime(comment.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
