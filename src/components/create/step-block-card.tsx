"use client";

import { X, User, Bot, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuideBuilder, type ClientBlock, type ClientStepBlock } from "@/hooks/use-guide-builder";

interface StepBlockCardProps {
  assignment: ClientStepBlock;
  block: ClientBlock;
  stepClientId: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

export function StepBlockCard({ assignment, block, stepClientId }: StepBlockCardProps) {
  const { dispatch } = useGuideBuilder();
  const isHuman = block.role === "human";
  const isCollapsed = assignment.displayMode === "collapsed";
  const isTrimmed = assignment.displayMode === "trimmed";

  function handleRemove() {
    dispatch({
      type: "UNASSIGN_BLOCK",
      payload: { blockClientId: block.clientId, stepClientId },
    });
  }

  function toggleCollapse() {
    dispatch({
      type: "SET_BLOCK_DISPLAY_MODE",
      payload: {
        stepClientId,
        blockClientId: block.clientId,
        mode: isCollapsed ? "full" : "collapsed",
      },
    });
  }

  const displayContent =
    block.content
      ? isTrimmed
        ? truncate(block.content, 200)
        : block.content
      : block.toolAction
        ? `[${block.toolAction}] ${block.filePath ?? ""}`
        : "...";

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-white/[0.04] p-2.5 transition-colors",
        isHuman ? "bg-blue-500/[0.03]" : "bg-violet-500/[0.03]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
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
            {block.filePath && (
              <span className="ml-0.5 max-w-[140px] truncate font-mono opacity-60">
                {block.filePath}
              </span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleCollapse}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content (hidden when collapsed) */}
      {!isCollapsed && (
        <p className="mt-1.5 whitespace-pre-wrap text-xs text-foreground/80 leading-relaxed">
          {displayContent}
        </p>
      )}
    </div>
  );
}
