"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TagInput } from "@/components/create/tag-input";
import { CategorySelect } from "@/components/create/category-select";
import { updateGuide } from "@/lib/supabase/queries/guides";
import type { GuideDetail } from "@/types";

interface EditGuideModalProps {
  open: boolean;
  guide: GuideDetail;
  onClose: () => void;
  onSaved: (updated: GuideDetail) => void;
}

export function EditGuideModal({ open, guide, onClose, onSaved }: EditGuideModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(guide.title);
  const [description, setDescription] = useState(guide.description);
  const [techs, setTechs] = useState<string[]>(guide.techs);
  const [categoryId, setCategoryId] = useState<string | null>(guide.category_id);
  const [saving, setSaving] = useState(false);

  // Reset form when guide changes
  useEffect(() => {
    setTitle(guide.title);
    setDescription(guide.description);
    setTechs(guide.techs);
    setCategoryId(guide.category_id);
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

    const updated = await updateGuide(guide.id, {
      title: title.trim(),
      description: description.trim(),
      techs,
      categoryId,
    });

    if (updated) {
      onSaved({
        ...guide,
        title: updated.title,
        description: updated.description,
        techs: updated.techs,
        category_id: updated.category_id,
        category: updated.category,
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
          <h2 className="text-lg font-semibold text-foreground">Edit guide</h2>
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
          </div>

          {/* Techs */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Technologies
            </label>
            <TagInput tags={techs} onChange={setTechs} />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Category
            </label>
            <CategorySelect value={categoryId} onChange={setCategoryId} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
