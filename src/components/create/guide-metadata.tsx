"use client";

import { cn } from "@/lib/utils";
import { useGuideBuilder } from "@/hooks/use-guide-builder";
import { MarkdownField } from "./markdown-field";
import { DifficultySelect } from "./difficulty-select";
import { GuideTypeSelect } from "./guide-type-select";
import { TagInput } from "./tag-input";
import { CategorySelect } from "./category-select";
import { MediaUpload } from "./media-upload";

export function GuideMetadata() {
  const { state, dispatch } = useGuideBuilder();

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <input
          type="text"
          value={state.title}
          onChange={(e) =>
            dispatch({ type: "SET_TITLE", payload: e.target.value })
          }
          placeholder="What will readers build?"
          className={cn(
            "w-full bg-transparent text-xl font-bold outline-none",
            "text-foreground placeholder:text-muted-foreground/50"
          )}
        />
      </div>

      {/* Description */}
      <MarkdownField
        label="Description"
        value={state.description}
        onChange={(v) => dispatch({ type: "SET_DESCRIPTION", payload: v })}
        placeholder="Tell readers about this guide, what they'll learn..."
        rows={3}
      />

      {/* What you'll build */}
      <MarkdownField
        label="What you'll build"
        value={state.whatYoullBuild}
        onChange={(v) => dispatch({ type: "SET_WHAT_YOULL_BUILD", payload: v })}
        placeholder="Describe the final result..."
        rows={2}
      />

      {/* Metadata row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Difficulty
          </label>
          <DifficultySelect
            value={state.difficulty}
            onChange={(v) => dispatch({ type: "SET_DIFFICULTY", payload: v })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Time estimate (min)
          </label>
          <input
            type="number"
            value={state.timeEstimate ?? ""}
            onChange={(e) =>
              dispatch({
                type: "SET_TIME_ESTIMATE",
                payload: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            placeholder="30"
            className={cn(
              "w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "focus:ring-2 focus:ring-accent/30 transition-shadow"
            )}
          />
        </div>
      </div>

      {/* Guide type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Type
        </label>
        <GuideTypeSelect
          value={state.guideType}
          onChange={(v) => dispatch({ type: "SET_GUIDE_TYPE", payload: v })}
        />
      </div>

      {/* Vibe coded toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={state.isVibeCoded}
          onChange={(e) =>
            dispatch({ type: "SET_VIBE_CODED", payload: e.target.checked })
          }
          className="h-4 w-4 rounded accent-accent"
        />
        <span className="text-sm text-foreground">Vibe coded</span>
        <span className="text-xs text-muted-foreground">
          — built primarily through prompts
        </span>
      </label>

      {/* Prerequisites */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Prerequisites
        </label>
        <TagInput
          tags={state.prerequisites}
          onChange={(v) =>
            dispatch({ type: "SET_PREREQUISITES", payload: v })
          }
          placeholder="e.g. Node.js, basic React knowledge"
        />
      </div>

      {/* Technologies */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Technologies
        </label>
        <TagInput
          tags={state.techs}
          onChange={(v) => dispatch({ type: "SET_TECHS", payload: v })}
          placeholder="Type and press Enter (e.g. Next.js, React)"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Category
        </label>
        <CategorySelect
          value={state.categoryId}
          onChange={(v) => dispatch({ type: "SET_CATEGORY_ID", payload: v })}
        />
      </div>

      {/* Media */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Media
        </label>
        <MediaUpload
          files={state.mediaFiles}
          onChange={(v) => dispatch({ type: "SET_MEDIA_FILES", payload: v })}
        />
      </div>
    </div>
  );
}
