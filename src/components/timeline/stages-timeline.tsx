"use client";

import {
  Map,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { PostStage } from "@/types";

interface StagesTimelineProps {
  stages: PostStage[];
}

export function StagesTimeline({ stages }: StagesTimelineProps) {
  const { t } = useTranslation();

  if (stages.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Map size={18} className="text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("timeline.howItWasBuilt")}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {stages.length} {stages.length === 1 ? "stage" : "stages"}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative ml-3">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />

        <div className="flex flex-col gap-6">
          {stages.map((stage, idx) => (
            <StageCard key={stage.id} stage={stage} index={idx} isLast={idx === stages.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StageCard({
  stage,
  index,
  isLast,
}: {
  stage: PostStage;
  index: number;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = stage.key_decisions.length > 0 || stage.problems_hit.length > 0;

  return (
    <div className="relative pl-6">
      {/* Node */}
      <div
        className={cn(
          "absolute left-0 top-3 flex h-5 w-5 -translate-x-[9px] items-center justify-center rounded-full text-[10px] font-bold",
          "bg-accent text-accent-foreground ring-4 ring-background"
        )}
      >
        {index + 1}
      </div>

      {/* Card */}
      <motion.div
        className="rounded-xl glass-card p-4 group"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Stage name */}
        <h3 className="text-lg font-semibold font-serif text-foreground group-hover:text-accent transition-colors">
          {stage.stage_name}
        </h3>

        {/* Summary */}
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {stage.summary}
        </p>

        {/* Messages badge */}
        {stage.duration_messages > 0 && (
          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            ~{stage.duration_messages} messages
          </span>
        )}

        {/* Expandable details */}
        {hasDetails && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide details" : `${stage.key_decisions.length} decisions, ${stage.problems_hit.length} problems`}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {stage.key_decisions.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <Lightbulb size={12} />
                      Decisions
                    </div>
                    <ul className="space-y-1">
                      {stage.key_decisions.map((d, i) => (
                        <li
                          key={i}
                          className="rounded-lg bg-emerald-500/5 px-3 py-1.5 text-xs text-foreground/80"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.problems_hit.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-500">
                      <AlertTriangle size={12} />
                      Problems
                    </div>
                    <ul className="space-y-1">
                      {stage.problems_hit.map((p, i) => (
                        <li
                          key={i}
                          className="rounded-lg bg-amber-500/5 px-3 py-1.5 text-xs text-foreground/80"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
