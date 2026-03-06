"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, ArrowRight } from "lucide-react";
import { cn, guideDetailPath } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

interface SearchResult {
  id: string;
  title: string;
  techs: string[];
  author: string;
}

const resultCache = new Map<string, SearchResult[]>();

export function SearchBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const cached = resultCache.get(term.trim().toLowerCase());
    if (cached) {
      setResults(cached);
      setOpen(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}&limit=6`);
      const data = await res.json();
      const items: SearchResult[] = (data.results ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        techs: r.techs ?? [],
        author: r.author,
      }));
      resultCache.set(term.trim().toLowerCase(), items);
      setResults(items);
      setOpen(true);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setSelectedIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Instant if cached
    const cached = resultCache.get(value.trim().toLowerCase());
    if (cached) {
      setResults(cached);
      setOpen(true);
      return;
    }

    // Debounce 250ms
    debounceRef.current = setTimeout(() => search(value), 250);
  }

  function navigate(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(guideDetailPath(result.id, result.title));
  }

  function handleFullSearch() {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleFullSearch();
      }
      return;
    }

    const total = results.length + 1; // +1 for "View all" row

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % total);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + total) % total);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIdx >= 0 && selectedIdx < results.length) {
          navigate(results[selectedIdx]);
        } else {
          handleFullSearch();
        }
        break;
      case "Escape":
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden max-w-md flex-1 px-8 md:block">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 transition-shadow",
          open ? "ring-2 ring-accent/30" : "focus-within:ring-2 focus-within:ring-accent/30"
        )}
      >
        <Search size={16} className="text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={t("nav.searchPlaceholder")}
          className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-accent" />
        )}
      </div>

      {/* Dropdown */}
      {open && query.trim() && (
        <div className="absolute left-8 right-8 top-full mt-2 z-[60] overflow-hidden rounded-xl bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/5">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            <div className="py-1">
              {results.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => navigate(r)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                    selectedIdx === idx
                      ? "bg-accent/10"
                      : "hover:bg-surface-hover"
                  )}
                >
                  <FileText size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      @{r.author}
                      {r.techs.length > 0 && (
                        <span className="ml-1.5 text-muted-foreground/60">
                          · {r.techs.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
              {/* View all results */}
              <button
                onClick={handleFullSearch}
                className={cn(
                  "flex w-full items-center gap-2 border-t border-border/40 px-4 py-2.5 text-sm font-medium transition-colors",
                  selectedIdx === results.length
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Search size={14} />
                {t("gallery.resultsFor", { query: query.trim() })}
                <ArrowRight size={14} className="ml-auto" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
