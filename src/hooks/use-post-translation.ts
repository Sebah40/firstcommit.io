"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { PostStage } from "@/types";

interface PostTranslation {
  title: string;
  hook_description: string;
  stages: PostStage[] | null;
}

/**
 * Fetches a cached post translation from the server.
 * Server translates + stores on first request; returns cache on subsequent ones.
 */
export function usePostTranslation(
  postId: string,
  original: { title: string; hook_description: string; stages?: PostStage[] }
): PostTranslation {
  const { locale } = useTranslation();
  const [translation, setTranslation] = useState<PostTranslation>({
    title: original.title,
    hook_description: original.hook_description,
    stages: original.stages ?? null,
  });
  const prevKey = useRef("");

  useEffect(() => {
    if (locale === "en") {
      setTranslation({
        title: original.title,
        hook_description: original.hook_description,
        stages: original.stages ?? null,
      });
      return;
    }

    const key = `${postId}:${locale}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    let cancelled = false;

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, locale }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;

        // Merge translated stages with original stage metadata
        let mergedStages: PostStage[] | null = null;
        if (data.stages && original.stages) {
          mergedStages = original.stages.map((orig, i) => {
            const tr = data.stages[i];
            if (!tr) return orig;
            return {
              ...orig,
              stage_name: tr.stage_name ?? orig.stage_name,
              summary: tr.summary ?? orig.summary,
              key_decisions: tr.key_decisions ?? orig.key_decisions,
              problems_hit: tr.problems_hit ?? orig.problems_hit,
            };
          });
        }

        setTranslation({
          title: data.title ?? original.title,
          hook_description: data.hook_description ?? original.hook_description,
          stages: mergedStages ?? original.stages ?? null,
        });
      })
      .catch(() => {
        // Keep originals on error
      });

    return () => {
      cancelled = true;
    };
  }, [postId, locale, original.title, original.hook_description, original.stages]);

  return locale === "en"
    ? { title: original.title, hook_description: original.hook_description, stages: original.stages ?? null }
    : translation;
}
