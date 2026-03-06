"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

const cache = new Map<string, string>();

function cacheKey(text: string, lang: string) {
  return `${lang}:${text}`;
}

/**
 * Translates an array of texts when locale !== "en".
 * Returns the translated array (or originals while loading / if locale is en).
 */
export function useTranslateTexts(texts: string[]): string[] {
  const { locale } = useTranslation();
  const [translated, setTranslated] = useState<string[]>(texts);
  const prevKey = useRef("");

  // Stabilize the texts array — only change identity when content changes
  const stableKey = texts.join("\0");
  const stableTexts = useMemo(() => texts, [stableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (locale === "en" || stableTexts.length === 0) {
      setTranslated(stableTexts);
      return;
    }

    const key = stableKey + "|" + locale;
    if (key === prevKey.current) return;
    prevKey.current = key;

    // Check cache first
    const allCached = stableTexts.every((t) => cache.has(cacheKey(t, locale)));
    if (allCached) {
      setTranslated(stableTexts.map((t) => cache.get(cacheKey(t, locale))!));
      return;
    }

    // Find which texts need translation
    const needed: { index: number; text: string }[] = [];
    const result = [...stableTexts];
    for (let i = 0; i < stableTexts.length; i++) {
      const cached = cache.get(cacheKey(stableTexts[i], locale));
      if (cached) {
        result[i] = cached;
      } else if (stableTexts[i].trim()) {
        needed.push({ index: i, text: stableTexts[i] });
      }
    }

    if (needed.length === 0) {
      setTranslated(result);
      return;
    }

    let cancelled = false;

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: needed.map((n) => n.text),
        target: locale,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.translated) return;
        for (let i = 0; i < needed.length; i++) {
          const t = data.translated[i] ?? needed[i].text;
          cache.set(cacheKey(needed[i].text, locale), t);
          result[needed[i].index] = t;
        }
        setTranslated([...result]);
      })
      .catch(() => {
        // On error, keep originals
      });

    return () => {
      cancelled = true;
    };
  }, [stableTexts, stableKey, locale]);

  return locale === "en" ? stableTexts : translated;
}

/**
 * Translates a single text string.
 */
export function useTranslateText(text: string | null | undefined): string {
  const arr = useTranslateTexts(text ? [text] : []);
  return text ? arr[0] ?? text : (text ?? "");
}
