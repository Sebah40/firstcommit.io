"use client";

import { useCallback } from "react";
import { useGuideBuilder, clientId } from "@/hooks/use-guide-builder";
import { ChatPicker } from "./chat-picker";
import { BlockPool } from "./block-pool";
import {
  categorizeBlock,
  extractFilesTouched,
} from "@/lib/parser/categorize-block";
import type { ParsedMessage } from "@/lib/parser/claude-code";

export function BlockSourcePanel() {
  const { state, dispatch } = useGuideBuilder();

  const handleImport = useCallback(
    (messages: ParsedMessage[], rawJson?: string) => {
      if (messages.length === 0) {
        dispatch({ type: "CLEAR_BLOCKS" });
        return;
      }

      const blocks = messages.map((msg, i) => ({
        clientId: clientId(),
        role: msg.role,
        content: msg.content,
        toolAction: msg.toolAction,
        filePath: msg.filePath,
        originalOrder: i,
        autoCategory: categorizeBlock(msg, i, messages.length),
        filesTouched: extractFilesTouched(msg),
        assignedToStepId: null,
      }));

      dispatch({
        type: "IMPORT_BLOCKS",
        payload: {
          blocks,
          originalJson: rawJson ?? JSON.stringify(messages),
        },
      });
    },
    [dispatch]
  );

  // When blocks are loaded, show the searchable pool
  if (state.blocks.length > 0) {
    return <BlockPool />;
  }

  // Otherwise show the chat import
  return (
    <ChatPickerAdapter onImport={handleImport} />
  );
}

/**
 * Adapter that wraps ChatPicker to intercept the onChange and also pass raw JSON.
 */
function ChatPickerAdapter({
  onImport,
}: {
  onImport: (messages: ParsedMessage[], rawJson?: string) => void;
}) {
  const handleChange = useCallback(
    (messages: ParsedMessage[]) => {
      onImport(messages);
    },
    [onImport]
  );

  return <ChatPicker messages={[]} onChange={handleChange} />;
}
