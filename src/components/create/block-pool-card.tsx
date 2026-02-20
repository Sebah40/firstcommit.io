"use client";

import { GripVertical, Terminal, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientBlock } from "@/hooks/use-guide-builder";

interface BlockPoolCardProps {
  block: ClientBlock;
  assigned: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  scaffold: "bg-blue-500/10 text-blue-500",
  feature: "bg-violet-500/10 text-violet-500",
  bug_fix: "bg-red-500/10 text-red-500",
  refactor: "bg-yellow-500/10 text-yellow-500",
  question: "bg-cyan-500/10 text-cyan-500",
  file_change: "bg-green-500/10 text-green-500",
  command: "bg-orange-500/10 text-orange-500",
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

export function BlockPoolCard({ block, assigned }: BlockPoolCardProps) {
  const isHuman = block.role === "human";

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", block.clientId);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable={!assigned}
      onDragStart={handleDragStart}
      className={cn(
        "group flex items-start gap-2 rounded-lg border transition-all",
        assigned
          ? "opacity-35 cursor-default border-transparent bg-transparent"
          : "cursor-grab border-white/[0.06] bg-muted/40 hover:bg-surface-hover hover:border-accent/20 hover:shadow-sm active:cursor-grabbing active:scale-[0.98]"
      )}
    >
      {/* Drag handle strip */}
      <div
        className={cn(
          "flex h-full w-6 shrink-0 items-center justify-center rounded-l-lg transition-colors",
          assigned
            ? "bg-transparent"
            : "bg-muted/60 group-hover:bg-accent/10"
        )}
      >
        {!assigned && (
          <GripVertical
            size={14}
            className="text-muted-foreground/40 group-hover:text-accent/60 transition-colors"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 py-2 pr-2">
        {/* Header */}
        <div className="mb-0.5 flex items-center gap-1.5">
          <div
            className={cn(
              "flex h-4 items-center gap-0.5 rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-wide",
              isHuman
                ? "bg-blue-500/10 text-blue-500"
                : "bg-violet-500/10 text-violet-500"
            )}
          >
            {isHuman ? <User size={8} /> : <Bot size={8} />}
            {isHuman ? "You" : "Claude"}
          </div>

          {block.toolAction && (
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Terminal size={8} />
              {block.toolAction}
            </div>
          )}

          {block.autoCategory && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[9px] font-medium",
                CATEGORY_COLORS[block.autoCategory] ?? "bg-muted text-muted-foreground"
              )}
            >
              {block.autoCategory.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Content preview */}
        <p className="text-xs text-foreground/70 leading-relaxed">
          {block.content
            ? truncate(block.content, 120)
            : block.toolAction
              ? `[${block.toolAction}] ${block.filePath ?? ""}`
              : "..."}
        </p>

        {/* File path */}
        {block.filePath && (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/60">
            {block.filePath}
          </p>
        )}
      </div>
    </div>
  );
}
