"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostMedia } from "@/types";

interface MediaGalleryProps {
  media: PostMedia[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + media.length) % media.length);
    },
    [media.length]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
    }
    if (media.length > 1) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [activeIndex, goTo, media.length]);

  if (media.length === 0) return null;

  const current = media[activeIndex];

  return (
    <div>
      {/* Hero display */}
      <div className="relative w-full overflow-hidden rounded-xl bg-muted">
        {current.type === "video" ? (
          <video
            src={current.url}
            controls
            className="w-full"
          />
        ) : (
          <img
            src={current.url}
            alt={`Media ${activeIndex + 1}`}
            className="w-full object-contain"
          />
        )}

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all",
                i === activeIndex
                  ? "ring-2 ring-accent"
                  : "opacity-50 hover:opacity-75"
              )}
            >
              {item.type === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <img
                  src={item.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
