"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Reply, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatRelativeTime, formatNumber } from "@/lib/utils";
import { checkCommentLikeStatus } from "@/lib/supabase/queries/guide-detail";
import {
  toggleCommentLikeAction,
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "@/lib/supabase/auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Comment } from "@/types";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  userId?: string | null;
  userUsername?: string;
  userAvatarUrl?: string | null;
  depth?: number;
  onReplyAdded?: (comment: Comment, parentId: string) => void;
  onCommentUpdated?: (commentId: string, content: string) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export function CommentItem({
  comment,
  postId,
  userId,
  userUsername,
  userAvatarUrl,
  depth = 0,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
}: CommentItemProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [likeChecked, setLikeChecked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit/delete state
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const isOwner = !!userId && userId === comment.user_id;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Lazy-check like status, returns current value
  async function ensureLikeStatus(): Promise<boolean> {
    if (likeChecked || !userId) return liked;
    const status = await checkCommentLikeStatus(comment.id, userId);
    setLiked(status);
    setLikeChecked(true);
    return status;
  }

  async function handleLike() {
    if (!userId) {
      router.push("/login");
      return;
    }
    const wasLiked = await ensureLikeStatus();
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
    await toggleCommentLikeAction(comment.id, userId, wasLiked);
  }

  async function handleReplySubmit() {
    if (!userId || !replyContent.trim()) return;
    setSubmitting(true);

    const newComment = await createCommentAction(
      postId,
      userId,
      replyContent.trim(),
      comment.id,
      comment.depth
    );

    if (newComment) {
      onReplyAdded?.(newComment, comment.id);
      setReplyContent("");
      setShowReply(false);
    }
    setSubmitting(false);
  }

  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setEditing(false);
      setEditContent(comment.content);
      return;
    }
    setSaving(true);
    const ok = await updateCommentAction(comment.id, trimmed);
    if (ok) {
      onCommentUpdated?.(comment.id, trimmed);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteCommentAction(comment.id);
    if (ok) {
      onCommentDeleted?.(comment.id);
    }
    setDeleting(false);
    setConfirmDelete(false);
  }

  const canReply = depth < 3 && !!userId;

  return (
    <div className={cn(depth > 0 && "ml-8")}>
      <div className="flex gap-3">
        <Avatar
          userId={comment.user_id}
          username={comment.profile?.username ?? "?"}
          avatarUrl={comment.profile?.avatar_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              {comment.profile?.username ?? "anonymous"}
            </span>
            <span className="text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>

            {/* Owner menu */}
            {isOwner && !editing && (
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-xl bg-surface py-1 shadow-lg ring-1 ring-white/10">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditContent(comment.content);
                        setEditing(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil size={12} />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-muted transition-colors"
                    >
                      <Trash2 size={12} />
                      {t("common.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content or edit textarea */}
          {editing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={saving}
                  className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || saving}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-foreground">{comment.content}</p>
          )}

          {/* Actions */}
          {!editing && (
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={handleLike}
                onMouseEnter={ensureLikeStatus}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart size={13} className={liked ? "fill-current" : ""} />
                {likesCount > 0 && formatNumber(likesCount)}
              </button>

              {canReply && (
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply size={13} />
                  {t("common.reply")}
                </button>
              )}
            </div>
          )}

          {/* Inline reply form */}
          {showReply && (
            <div className="mt-3 flex gap-2">
              <Avatar
                userId={userId!}
                username={userUsername ?? "?"}
                avatarUrl={userAvatarUrl}
                size="sm"
              />
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t("comments.writeReply")}
                  rows={2}
                  className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
                />
                <div className="mt-1.5 flex justify-end gap-2">
                  <button
                    onClick={() => setShowReply(false)}
                    className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim() || submitting}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground disabled:opacity-50"
                  >
                    {t("common.reply")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  userId={userId}
                  userUsername={userUsername}
                  userAvatarUrl={userAvatarUrl}
                  depth={depth + 1}
                  onReplyAdded={onReplyAdded}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t("comments.deleteComment")}
        message={t("comments.deleteCommentConfirm")}
        loading={deleting}
      />
    </div>
  );
}
