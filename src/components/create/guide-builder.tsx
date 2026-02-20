"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, GripVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn, guideDetailPath } from "@/lib/utils";
import { useGuideBuilder, GuideBuilderProvider } from "@/hooks/use-guide-builder";
import { GuideMetadata } from "./guide-metadata";
import { StepList } from "./step-list";
import { BlockSourcePanel } from "./block-source-panel";
import { publishGuide } from "@/lib/supabase/queries/create-guide";

interface GuideBuilderProps {
  userId: string;
}

function GuideBuilderInner({ userId }: GuideBuilderProps) {
  const { state, dispatch } = useGuideBuilder();
  const router = useRouter();

  async function handlePublish() {
    if (!state.title.trim()) {
      dispatch({ type: "SET_ERROR", payload: "Title is required" });
      return;
    }

    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_PUBLISHING", payload: true });

    const guideId = await publishGuide({ state, userId });

    if (!guideId) {
      dispatch({ type: "SET_ERROR", payload: "Failed to publish. Please try again." });
      dispatch({ type: "SET_PUBLISHING", payload: false });
      return;
    }

    router.push(guideDetailPath(guideId, state.title.trim()));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-xl font-semibold text-foreground">
          Create a guide
        </h1>
        <button
          onClick={handlePublish}
          disabled={state.publishing || !state.title.trim()}
          className={cn(
            "rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground",
            "hover:opacity-90 transition-opacity",
            "disabled:opacity-50"
          )}
        >
          {state.publishing ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Publishing...
            </span>
          ) : (
            "Publish Guide"
          )}
        </button>
      </div>

      {state.error && (
        <p className="mb-4 text-sm text-red-500">{state.error}</p>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Editor */}
        <div className="min-w-0 flex-1 space-y-8">
          <GuideMetadata />

          <div className="h-px bg-white/[0.06]" />

          <StepList />
        </div>

        {/* Right: Block source panel (desktop) */}
        <div className="hidden w-[380px] shrink-0 lg:block">
          <div className="sticky top-20">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Conversation Blocks
              </h2>
              {state.blocks.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <GripVertical size={10} />
                  Drag into steps
                </span>
              )}
            </div>
            <div className="max-h-[calc(100vh-120px)] overflow-hidden rounded-xl bg-muted/50 p-3">
              <BlockSourcePanel />
            </div>
          </div>
        </div>

        {/* Right: Block source panel (mobile — shown below) */}
        <div className="lg:hidden">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Import Conversation
          </h2>
          <BlockSourcePanel />
        </div>
      </div>
    </div>
  );
}

export function GuideBuilder({ userId }: GuideBuilderProps) {
  return (
    <GuideBuilderProvider>
      <GuideBuilderInner userId={userId} />
    </GuideBuilderProvider>
  );
}
