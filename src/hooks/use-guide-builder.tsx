"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { Difficulty, GuideType } from "@/types";
import type { MediaFile } from "@/components/create/media-upload";

// ─── Client-side types ───────────────────────────────────

export interface ClientBlock {
  clientId: string;
  role: "human" | "assistant";
  content: string;
  toolAction: string | null;
  filePath: string | null;
  originalOrder: number;
  autoCategory: string | null;
  filesTouched: string[];
  assignedToStepId: string | null;
}

export interface ClientStepBlock {
  clientId: string;
  blockClientId: string;
  position: number;
  displayMode: "full" | "collapsed" | "trimmed" | "ghost";
  authorNote: string;
}

export interface ClientStep {
  clientId: string;
  title: string;
  description: string;
  authorAnnotation: string;
  suggestedPrompt: string;
  checkpointDescription: string;
  order: number;
  blockAssignments: ClientStepBlock[];
}

// ─── State ───────────────────────────────────────────────

export interface GuideBuilderState {
  // Metadata
  title: string;
  description: string;
  difficulty: Difficulty | null;
  timeEstimate: number | null;
  isVibeCoded: boolean;
  guideType: GuideType;
  prerequisites: string[];
  whatYoullBuild: string;
  techs: string[];
  categoryId: string | null;
  mediaFiles: MediaFile[];

  // Content
  blocks: ClientBlock[];
  steps: ClientStep[];

  // UI
  publishing: boolean;
  error: string;
  originalJson: string | null;
}

export const initialState: GuideBuilderState = {
  title: "",
  description: "",
  difficulty: null,
  timeEstimate: null,
  isVibeCoded: false,
  guideType: "full_app",
  prerequisites: [],
  whatYoullBuild: "",
  techs: [],
  categoryId: null,
  mediaFiles: [],
  blocks: [],
  steps: [],
  publishing: false,
  error: "",
  originalJson: null,
};

// ─── Actions ─────────────────────────────────────────────

export type GuideBuilderAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_DIFFICULTY"; payload: Difficulty | null }
  | { type: "SET_TIME_ESTIMATE"; payload: number | null }
  | { type: "SET_VIBE_CODED"; payload: boolean }
  | { type: "SET_GUIDE_TYPE"; payload: GuideType }
  | { type: "SET_PREREQUISITES"; payload: string[] }
  | { type: "SET_WHAT_YOULL_BUILD"; payload: string }
  | { type: "SET_TECHS"; payload: string[] }
  | { type: "SET_CATEGORY_ID"; payload: string | null }
  | { type: "SET_MEDIA_FILES"; payload: MediaFile[] }
  | { type: "IMPORT_BLOCKS"; payload: { blocks: ClientBlock[]; originalJson: string } }
  | { type: "CLEAR_BLOCKS" }
  | { type: "ADD_STEP" }
  | { type: "REMOVE_STEP"; payload: string }
  | { type: "REORDER_STEPS"; payload: string[] }
  | { type: "UPDATE_STEP"; payload: { stepId: string; field: keyof Omit<ClientStep, "clientId" | "order" | "blockAssignments">; value: string } }
  | { type: "ASSIGN_BLOCK"; payload: { blockClientId: string; stepClientId: string } }
  | { type: "UNASSIGN_BLOCK"; payload: { blockClientId: string; stepClientId: string } }
  | { type: "REORDER_STEP_BLOCKS"; payload: { stepClientId: string; blockClientIds: string[] } }
  | { type: "SET_BLOCK_DISPLAY_MODE"; payload: { stepClientId: string; blockClientId: string; mode: ClientStepBlock["displayMode"] } }
  | { type: "SET_BLOCK_AUTHOR_NOTE"; payload: { stepClientId: string; blockClientId: string; note: string } }
  | { type: "SET_PUBLISHING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

// ─── ID helper ───────────────────────────────────────────

let _counter = 0;
export function clientId(): string {
  return `c_${Date.now()}_${++_counter}`;
}

// ─── Reducer ─────────────────────────────────────────────

export function guideBuilderReducer(
  state: GuideBuilderState,
  action: GuideBuilderAction
): GuideBuilderState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_DIFFICULTY":
      return { ...state, difficulty: action.payload };
    case "SET_TIME_ESTIMATE":
      return { ...state, timeEstimate: action.payload };
    case "SET_VIBE_CODED":
      return { ...state, isVibeCoded: action.payload };
    case "SET_GUIDE_TYPE":
      return { ...state, guideType: action.payload };
    case "SET_PREREQUISITES":
      return { ...state, prerequisites: action.payload };
    case "SET_WHAT_YOULL_BUILD":
      return { ...state, whatYoullBuild: action.payload };
    case "SET_TECHS":
      return { ...state, techs: action.payload };
    case "SET_CATEGORY_ID":
      return { ...state, categoryId: action.payload };
    case "SET_MEDIA_FILES":
      return { ...state, mediaFiles: action.payload };

    case "IMPORT_BLOCKS":
      return {
        ...state,
        blocks: action.payload.blocks,
        originalJson: action.payload.originalJson,
      };

    case "CLEAR_BLOCKS":
      return {
        ...state,
        blocks: [],
        originalJson: null,
        steps: state.steps.map((s) => ({ ...s, blockAssignments: [] })),
      };

    case "ADD_STEP": {
      const newStep: ClientStep = {
        clientId: clientId(),
        title: "",
        description: "",
        authorAnnotation: "",
        suggestedPrompt: "",
        checkpointDescription: "",
        order: state.steps.length,
        blockAssignments: [],
      };
      return { ...state, steps: [...state.steps, newStep] };
    }

    case "REMOVE_STEP": {
      const removedStep = state.steps.find((s) => s.clientId === action.payload);
      const freedBlockIds = new Set(
        removedStep?.blockAssignments.map((a) => a.blockClientId) ?? []
      );
      return {
        ...state,
        steps: state.steps
          .filter((s) => s.clientId !== action.payload)
          .map((s, i) => ({ ...s, order: i })),
        blocks: state.blocks.map((b) =>
          freedBlockIds.has(b.clientId)
            ? { ...b, assignedToStepId: null }
            : b
        ),
      };
    }

    case "REORDER_STEPS": {
      const orderMap = new Map(action.payload.map((id, i) => [id, i]));
      return {
        ...state,
        steps: [...state.steps]
          .sort((a, b) => (orderMap.get(a.clientId) ?? 0) - (orderMap.get(b.clientId) ?? 0))
          .map((s, i) => ({ ...s, order: i })),
      };
    }

    case "UPDATE_STEP":
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.clientId === action.payload.stepId
            ? { ...s, [action.payload.field]: action.payload.value }
            : s
        ),
      };

    case "ASSIGN_BLOCK": {
      const { blockClientId, stepClientId } = action.payload;
      const targetStep = state.steps.find((s) => s.clientId === stepClientId);
      if (!targetStep) return state;
      const already = targetStep.blockAssignments.some(
        (a) => a.blockClientId === blockClientId
      );
      if (already) return state;

      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.clientId === blockClientId
            ? { ...b, assignedToStepId: stepClientId }
            : b
        ),
        steps: state.steps.map((s) =>
          s.clientId === stepClientId
            ? {
                ...s,
                blockAssignments: [
                  ...s.blockAssignments,
                  {
                    clientId: clientId(),
                    blockClientId,
                    position: s.blockAssignments.length,
                    displayMode: "full" as const,
                    authorNote: "",
                  },
                ],
              }
            : s
        ),
      };
    }

    case "UNASSIGN_BLOCK": {
      const { blockClientId, stepClientId } = action.payload;
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.clientId === blockClientId
            ? { ...b, assignedToStepId: null }
            : b
        ),
        steps: state.steps.map((s) =>
          s.clientId === stepClientId
            ? {
                ...s,
                blockAssignments: s.blockAssignments
                  .filter((a) => a.blockClientId !== blockClientId)
                  .map((a, i) => ({ ...a, position: i })),
              }
            : s
        ),
      };
    }

    case "REORDER_STEP_BLOCKS": {
      const { stepClientId, blockClientIds } = action.payload;
      return {
        ...state,
        steps: state.steps.map((s) => {
          if (s.clientId !== stepClientId) return s;
          const byBlockId = new Map(
            s.blockAssignments.map((a) => [a.blockClientId, a])
          );
          return {
            ...s,
            blockAssignments: blockClientIds
              .map((id, i) => {
                const existing = byBlockId.get(id);
                return existing ? { ...existing, position: i } : null;
              })
              .filter((a): a is ClientStepBlock => a !== null),
          };
        }),
      };
    }

    case "SET_BLOCK_DISPLAY_MODE":
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.clientId === action.payload.stepClientId
            ? {
                ...s,
                blockAssignments: s.blockAssignments.map((a) =>
                  a.blockClientId === action.payload.blockClientId
                    ? { ...a, displayMode: action.payload.mode }
                    : a
                ),
              }
            : s
        ),
      };

    case "SET_BLOCK_AUTHOR_NOTE":
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.clientId === action.payload.stepClientId
            ? {
                ...s,
                blockAssignments: s.blockAssignments.map((a) =>
                  a.blockClientId === action.payload.blockClientId
                    ? { ...a, authorNote: action.payload.note }
                    : a
                ),
              }
            : s
        ),
      };

    case "SET_PUBLISHING":
      return { ...state, publishing: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────

interface GuideBuilderContextValue {
  state: GuideBuilderState;
  dispatch: Dispatch<GuideBuilderAction>;
}

const GuideBuilderContext = createContext<GuideBuilderContextValue | null>(null);

export function GuideBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(guideBuilderReducer, initialState);

  return (
    <GuideBuilderContext value={{ state, dispatch }}>
      {children}
    </GuideBuilderContext>
  );
}

export function useGuideBuilder(): GuideBuilderContextValue {
  const ctx = useContext(GuideBuilderContext);
  if (!ctx) {
    throw new Error("useGuideBuilder must be used within GuideBuilderProvider");
  }
  return ctx;
}
