"use client";

import { Plus } from "lucide-react";
import { Reorder } from "framer-motion";
import { useGuideBuilder } from "@/hooks/use-guide-builder";
import { StepCard } from "./step-card";

export function StepList() {
  const { state, dispatch } = useGuideBuilder();

  function handleReorder(newOrder: typeof state.steps) {
    dispatch({
      type: "REORDER_STEPS",
      payload: newOrder.map((s) => s.clientId),
    });
  }

  function addStep() {
    dispatch({ type: "ADD_STEP" });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Steps</h2>
        <span className="text-xs text-muted-foreground">
          {state.steps.length} {state.steps.length === 1 ? "step" : "steps"}
        </span>
      </div>

      {state.steps.length > 0 && (
        <Reorder.Group
          axis="y"
          values={state.steps}
          onReorder={handleReorder}
          className="mb-3 space-y-3"
        >
          {state.steps.map((step, i) => (
            <Reorder.Item key={step.clientId} value={step}>
              <StepCard step={step} index={i} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <button
        type="button"
        onClick={addStep}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={14} />
        Add step
      </button>
    </div>
  );
}
