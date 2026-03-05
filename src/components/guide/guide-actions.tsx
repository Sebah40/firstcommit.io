"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { toggleLikeAction, toggleSaveAction, deleteGuide } from "@/lib/supabase/auth";
import { EditGuideModal } from "@/components/guide/edit-guide-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GuideDetail } from "@/types";

interface GuideActionsProps {
  guideId: string;
  userId?: string | null;
  initialLiked: boolean;
  initialSaved: boolean;
  likesCount: number;
  savesCount: number;
  isOwner?: boolean;
  guide?: GuideDetail | null;
  onGuideUpdated?: (updated: GuideDetail) => void;
  onGuideDeleted?: () => void;
}

export function GuideActions({
  guideId,
  userId,
  initialLiked,
  initialSaved,
  likesCount,
  savesCount,
  isOwner,
  guide,
  onGuideUpdated,
  onGuideDeleted,
}: GuideActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(likesCount);
  const [saves, setSaves] = useState(savesCount);

  // Sync with parent when async status check resolves
  useEffect(() => setLiked(initialLiked), [initialLiked]);
  useEffect(() => setSaved(initialSaved), [initialSaved]);
  const [copied, setCopied] = useState(false);

  // Owner menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  async function handleLike() {
    if (!userId) {
      router.push("/login");
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((c) => (wasLiked ? c - 1 : c + 1));
    await toggleLikeAction(guideId, userId, wasLiked);
  }

  async function handleSave() {
    if (!userId) {
      router.push("/login");
      return;
    }
    const wasSaved = saved;
    setSaved(!wasSaved);
    setSaves((c) => (wasSaved ? c - 1 : c + 1));
    await toggleSaveAction(guideId, userId, wasSaved);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteGuide(guideId);
    if (ok) {
      onGuideDeleted?.();
      router.push("/");
    }
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            liked
              ? "bg-red-500/10 text-red-500"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart size={16} className={liked ? "fill-current" : ""} />
          {formatNumber(likes)}
        </button>

        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            saved
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark size={16} className={saved ? "fill-current" : ""} />
          {formatNumber(saves)}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link2 size={16} />
          {copied ? t("common.copied") : t("common.share")}
        </button>

        {/* Owner actions */}
        {isOwner && guide && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl bg-surface py-1 shadow-lg ring-1 ring-white/10">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={14} />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted transition-colors"
                >
                  <Trash2 size={14} />
                  {t("common.delete")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {isOwner && guide && (
        <EditGuideModal
          open={editOpen}
          guide={guide}
          userId={userId!}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => onGuideUpdated?.(updated)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t("guide.deleteGuide")}
        message={t("guide.deleteGuideConfirm")}
        loading={deleting}
      />
    </>
  );
}
