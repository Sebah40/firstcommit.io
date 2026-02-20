import type { ParsedMessage } from "./claude-code";

export type BlockCategory =
  | "scaffold"
  | "feature"
  | "bug_fix"
  | "refactor"
  | "question"
  | "file_change"
  | "command";

const BUG_PATTERN = /\b(fix|bug|error|issue|broken|crash|fail|typo|patch)\b/i;
const REFACTOR_PATTERN = /\b(refactor|clean|reorganize|rename|simplify|extract)\b/i;
const WRITE_TOOLS = new Set(["Write", "Edit", "NotebookEdit"]);

export function categorizeBlock(
  msg: ParsedMessage,
  index: number,
  total: number
): BlockCategory {
  // Tool-based categories take priority
  if (msg.toolAction) {
    if (WRITE_TOOLS.has(msg.toolAction)) return "file_change";
    if (msg.toolAction === "Bash") return "command";
  }

  // Human questions
  if (msg.role === "human" && msg.content.includes("?")) return "question";

  // Content-based heuristics
  if (BUG_PATTERN.test(msg.content)) return "bug_fix";
  if (REFACTOR_PATTERN.test(msg.content)) return "refactor";

  // Early assistant messages are likely scaffolding
  if (index < 5 && msg.role === "assistant") return "scaffold";

  return "feature";
}

export function extractFilesTouched(msg: ParsedMessage): string[] {
  if (!msg.filePath) return [];
  // Normalize and dedupe
  return [msg.filePath.replace(/^\/+/, "")];
}
