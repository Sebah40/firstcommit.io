"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TagInput } from "@/components/create/tag-input";
import { CategorySelect } from "@/components/create/category-select";
import { ImageUpload } from "@/components/guide/image-upload";
import { updateGuideAction } from "@/lib/supabase/auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GuideDetail, PostMedia } from "@/types";

interface EditGuideModalProps {
  open: boolean;
  guide: GuideDetail;
  userId: string;
  onClose: () => void;
  onSaved: (updated: GuideDetail) => void;
}

export function EditGuideModal({ open, guide, userId, onClose, onSaved }: EditGuideModalProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(guide.title);
  const [hookDescription, setHookDescription] = useState(guide.hook_description);
  const [techs, setTechs] = useState<string[]>(guide.techs);
  const [categoryId, setCategoryId] = useState<string | null>(guide.category_id);
  const [instanceUrl, setInstanceUrl] = useState(guide.instance_url ?? "");
  const [repoUrl, setRepoUrl] = useState(guide.repo_url ?? "");
  const [media, setMedia] = useState<PostMedia[]>(guide.media ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(guide.title);
    setHookDescription(guide.hook_description);
    setTechs(guide.techs);
    setCategoryId(guide.category_id);
    setInstanceUrl(guide.instance_url ?? "");
    setRepoUrl(guide.repo_url ?? "");
    setMedia(guide.media ?? []);
  }, [guide]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const updated = await updateGuideAction(guide.id, {
      title: title.trim(),
      hookDescription: hookDescription.trim(),
      techs,
      categoryId,
      instanceUrl: instanceUrl.trim() || null,
      repoUrl: repoUrl.trim() || null,
    });

    if (updated) {
      onSaved({
        ...guide,
        title: updated.title,
        hook_description: updated.hook_description,
        techs: updated.techs,
        category_id: updated.category_id,
        category: updated.category,
        instance_url: updated.instance_url,
        repo_url: updated.repo_url,
        media,
      });
      onClose();
    }
    setSaving(false);
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("guide.editGuide")}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("common.title")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Hook Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("common.description")}
            </label>
            <textarea
              value={hookDescription}
              onChange={(e) => setHookDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Techs */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("common.technologies")}
            </label>
            <TagInput tags={techs} onChange={setTechs} />
          </div>

          {/* Instance URL */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Live URL
            </label>
            <input
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://myproject.com"
              className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Repo URL */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              GitHub Repo
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/project"
              className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("common.category")}
            </label>
            <CategorySelect value={categoryId} onChange={setCategoryId} />
          </div>

          {/* Images */}
          <ImageUpload
            postId={guide.id}
            userId={userId}
            media={media}
            onChange={setMedia}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? t("common.saving") : t("guide.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
