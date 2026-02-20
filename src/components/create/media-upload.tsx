"use client";

import { useRef } from "react";
import { ImagePlus, X, Film } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface MediaUploadProps {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  max?: number;
}

export function MediaUpload({ files, onChange, max = 6 }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const newFiles: MediaFile[] = [];
    for (let i = 0; i < fileList.length && files.length + newFiles.length < max; i++) {
      const file = fileList[i];
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      });
    }

    onChange([...files, ...newFiles]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(files[index].preview);
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {files.map((media, i) => (
          <div key={media.preview} className="group relative aspect-video overflow-hidden rounded-lg bg-muted">
            {media.type === "video" ? (
              <video
                src={media.preview}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={media.preview}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            {media.type === "video" && (
              <div className="absolute bottom-1 left-1">
                <Film size={14} className="text-white drop-shadow" />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeFile(i)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {files.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-video flex-col items-center justify-center gap-1 rounded-lg",
              "bg-muted text-muted-foreground",
              "hover:text-foreground transition-colors",
              "cursor-pointer"
            )}
          >
            <ImagePlus size={20} />
            <span className="text-xs">Add media</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
