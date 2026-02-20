"use client";

import { useState } from "react";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuideBuilder, type ClientStep } from "@/hooks/use-guide-builder";
import { StepBlockList } from "./step-block-list";

interface StepCardProps {
  step: ClientStep;
  index: number;
}

export function StepCard({ step, index }: StepCardProps) {
  const { state, dispatch } = useGuideBuilder();
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  const unassignedBlocks = state.blocks.filter((b) => !b.assignedToStepId);

  function handleRemove() {
    dispatch({ type: "REMOVE_STEP", payload: step.clientId });
  }

  function updateField(field: "title" | "description" | "authorAnnotation" | "suggestedPrompt" | "checkpointDescription", value: string) {
    dispatch({
      type: "UPDATE_STEP",
      payload: { stepId: step.clientId, field, value },
    });
  }

  // --- Drop zone handlers ---
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const blockClientId = e.dataTransfer.getData("text/plain");
    if (!blockClientId) return;
    dispatch({
      type: "ASSIGN_BLOCK",
      payload: { blockClientId, stepClientId: step.clientId },
    });
  }

  // Mobile: assign block by tap
  function handleMobileAssign(blockClientId: string) {
    dispatch({
      type: "ASSIGN_BLOCK",
      payload: { blockClientId, stepClientId: step.clientId },
    });
    setShowMobileSheet(false);
  }

  return (
    <div className="rounded-xl bg-surface-hover/50 p-4">
      {/* Step header */}
      <div className="mb-3 flex items-center gap-2">
        <GripVertical
          size={16}
          className="shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing"
        />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {index + 1}
        </span>
        <input
          type="text"
          value={step.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder={`Step ${index + 1} title`}
          className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-md p-1 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pl-8">
          {/* Description */}
          <textarea
            value={step.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="What happens in this step..."
            rows={2}
            className={cn(
              "w-full resize-none rounded-lg bg-muted px-3 py-2 text-xs outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "focus:ring-2 focus:ring-accent/30 transition-shadow"
            )}
          />

          {/* Suggested prompt */}
          <input
            type="text"
            value={step.suggestedPrompt}
            onChange={(e) => updateField("suggestedPrompt", e.target.value)}
            placeholder="Suggested prompt for this step..."
            className={cn(
              "w-full rounded-lg bg-muted px-3 py-2 text-xs outline-none",
              "text-foreground placeholder:text-muted-foreground font-mono",
              "focus:ring-2 focus:ring-accent/30 transition-shadow"
            )}
          />

          {/* Checkpoint */}
          <input
            type="text"
            value={step.checkpointDescription}
            onChange={(e) => updateField("checkpointDescription", e.target.value)}
            placeholder="Checkpoint: what should work after this step..."
            className={cn(
              "w-full rounded-lg bg-muted px-3 py-2 text-xs outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "focus:ring-2 focus:ring-accent/30 transition-shadow"
            )}
          />

          {/* Assigned blocks */}
          {step.blockAssignments.length > 0 && (
            <StepBlockList
              stepClientId={step.clientId}
              assignments={step.blockAssignments}
            />
          )}

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "hidden items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-center text-xs transition-all lg:flex",
              dragOver
                ? "border-accent bg-accent/10 text-accent scale-[1.01]"
                : "border-muted-foreground/25 bg-muted/30 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50"
            )}
          >
            <Plus size={14} className={cn(dragOver ? "text-accent" : "text-muted-foreground/50")} />
            {dragOver ? "Drop block here" : "Drag blocks here from the panel"}
          </div>

          {/* Mobile: add block button */}
          <button
            type="button"
            onClick={() => setShowMobileSheet(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted py-2 text-xs text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <Plus size={12} />
            Add block
          </button>

          {/* Mobile sheet */}
          {showMobileSheet && (
            <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
              <div
                className="flex-1 bg-black/50"
                onClick={() => setShowMobileSheet(false)}
              />
              <div className="max-h-[60vh] overflow-y-auto rounded-t-2xl bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Add a block
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMobileSheet(false)}
                    className="text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
                {unassignedBlocks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    All blocks are assigned
                  </p>
                ) : (
                  <div className="space-y-1">
                    {unassignedBlocks.map((block) => (
                      <button
                        key={block.clientId}
                        type="button"
                        onClick={() => handleMobileAssign(block.clientId)}
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-muted transition-colors"
                      >
                        <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs text-foreground">
                          {block.content
                            ? block.content.slice(0, 80)
                            : `[${block.toolAction}] ${block.filePath ?? ""}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
