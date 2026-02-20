"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuideBuilder } from "@/hooks/use-guide-builder";
import { BlockPoolCard } from "./block-pool-card";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "human", label: "You" },
  { value: "assistant", label: "Claude" },
  { value: "file_change", label: "Files" },
  { value: "command", label: "Commands" },
  { value: "unassigned", label: "Available" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

export function BlockPool() {
  const { state } = useGuideBuilder();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    let result = state.blocks;

    if (filter === "unassigned") {
      result = result.filter((b) => !b.assignedToStepId);
    } else if (filter === "human" || filter === "assistant") {
      result = result.filter((b) => b.role === filter);
    } else if (filter === "file_change" || filter === "command") {
      result = result.filter((b) => b.autoCategory === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.content.toLowerCase().includes(q) ||
          b.filePath?.toLowerCase().includes(q) ||
          b.toolAction?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [state.blocks, search, filter]);

  if (state.blocks.length === 0) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className={cn(
            "w-full rounded-lg bg-muted pl-8 pr-3 py-2 text-xs outline-none",
            "text-foreground placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-accent/30 transition-shadow"
          )}
        />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap gap-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(filter === opt.value ? "all" : opt.value)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              filter === opt.value
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Block list */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {filtered.map((block) => (
          <BlockPoolCard
            key={block.clientId}
            block={block}
            assigned={!!block.assignedToStepId}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No matching blocks
          </p>
        )}
      </div>

      {/* Count */}
      <div className="mt-2 text-[10px] text-muted-foreground">
        {state.blocks.filter((b) => !b.assignedToStepId).length} of{" "}
        {state.blocks.length} available
      </div>
    </div>
  );
}
