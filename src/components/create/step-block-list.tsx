"use client";

import { Reorder } from "framer-motion";
import { useGuideBuilder } from "@/hooks/use-guide-builder";
import { StepBlockCard } from "./step-block-card";
import type { ClientStepBlock } from "@/hooks/use-guide-builder";

interface StepBlockListProps {
  stepClientId: string;
  assignments: ClientStepBlock[];
}

export function StepBlockList({ stepClientId, assignments }: StepBlockListProps) {
  const { state, dispatch } = useGuideBuilder();

  const blockMap = new Map(state.blocks.map((b) => [b.clientId, b]));

  function handleReorder(newOrder: ClientStepBlock[]) {
    dispatch({
      type: "REORDER_STEP_BLOCKS",
      payload: {
        stepClientId,
        blockClientIds: newOrder.map((a) => a.blockClientId),
      },
    });
  }

  if (assignments.length === 0) return null;

  return (
    <Reorder.Group
      axis="y"
      values={assignments}
      onReorder={handleReorder}
      className="space-y-1.5"
    >
      {assignments.map((assignment) => {
        const block = blockMap.get(assignment.blockClientId);
        if (!block) return null;

        return (
          <Reorder.Item key={assignment.blockClientId} value={assignment}>
            <StepBlockCard
              assignment={assignment}
              block={block}
              stepClientId={stepClientId}
            />
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}
