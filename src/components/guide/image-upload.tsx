"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { PostMedia } from "@/types";

interface ImageUploadProps {
  postId: string;
  userId: string;
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
}

export function ImageUpload({ postId, userId, media, onChange }: ImageUploadProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newMedia: PostMedia[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop() || "jpg";
      const order = media.length + i;
      const path = `${userId}/${postId}/${order}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        console.error("Upload failed:", uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);

      const { data: row, error: insertError } = await supabase
        .from("post_media")
        .insert({
          post_id: postId,
          url: urlData.publicUrl,
          type: "image",
          order,
        })
        .select("*")
        .single();

      if (!insertError && row) {
        newMedia.push(row as PostMedia);
      }
    }

    onChange([...media, ...newMedia]);
    setUploading(false);
  }

  async function handleRemove(item: PostMedia) {
    const supabase = createClient();

    // Delete from DB
    await supabase.from("post_media").delete().eq("id", item.id);

    // Try to delete from storage (extract path from URL)
    try {
      const url = new URL(item.url);
      const storagePath = url.pathname.split("/post-media/")[1];
      if (storagePath) {
        await supabase.storage.from("post-media").remove([decodeURIComponent(storagePath)]);
      }
    } catch {
      // Storage delete is best-effort
    }

    onChange(media.filter((m) => m.id !== item.id));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("media.addMedia")}
      </label>

      {/* Existing images */}
      {media.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {media.map((item, i) => (
            <div key={item.id} className="group relative h-20 w-28 overflow-hidden rounded-lg bg-muted">
              <img
                src={item.url}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  Cover
                </span>
              )}
              <button
                onClick={() => handleRemove(item)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / picker */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-sm transition-colors",
          dragOver
            ? "border-accent bg-accent/5 text-accent"
            : "border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
        )}
      >
        {uploading ? (
          <span>{t("common.saving")}</span>
        ) : (
          <>
            <ImagePlus size={18} />
            <span>{media.length === 0 ? "Add a cover image" : "Add more images"}</span>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
