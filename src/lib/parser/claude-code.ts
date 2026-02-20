/**
 * Parser for Claude Code JSONL conversation history.
 *
 * Claude Code stores conversations in ~/.claude/projects/{project-path}/{uuid}.jsonl
 * Each line is a JSON object with a "type" field:
 *   - "user" (role: "user")     → user messages
 *   - "assistant" (role: "assistant") → assistant messages with text, thinking, or tool_use
 *   - "progress"               → ignored
 *   - "file-history-snapshot"   → ignored
 *
 * Content can be a string or an array of content blocks:
 *   { type: "text", text: "..." }
 *   { type: "tool_use", name: "Write", input: { file_path: "...", ... } }
 *   { type: "tool_result", content: "..." }
 */

export interface ParsedMessage {
  role: "human" | "assistant";
  content: string;
  toolAction: string | null;
  filePath: string | null;
}

interface RawMessage {
  type: string;
  role?: string;
  content?: string | ContentBlock[];
  message?: {
    role: string;
    content: string | ContentBlock[];
  };
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

function extractContent(content: string | ContentBlock[]): {
  text: string;
  toolAction: string | null;
  filePath: string | null;
} {
  if (typeof content === "string") {
    // Strip XML tags from system messages
    const cleaned = content
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return { text: cleaned, toolAction: null, filePath: null };
  }

  let text = "";
  let toolAction: string | null = null;
  let filePath: string | null = null;

  for (const block of content) {
    if (block.type === "text" && block.text) {
      text += block.text;
    } else if (block.type === "tool_use" && block.name) {
      toolAction = block.name;
      if (block.input) {
        const fp =
          (block.input.file_path as string) ||
          (block.input.path as string) ||
          (block.input.command as string);
        if (fp) filePath = fp;
      }
    }
    // Skip tool_result, thinking blocks
  }

  return { text: text.trim(), toolAction, filePath };
}

export function parseClaudeCodeJsonl(jsonlContent: string): ParsedMessage[] {
  const lines = jsonlContent.split("\n").filter((l) => l.trim());
  const messages: ParsedMessage[] = [];

  for (const line of lines) {
    let raw: RawMessage;
    try {
      raw = JSON.parse(line);
    } catch {
      continue;
    }

    // Only process user and assistant messages
    if (raw.type !== "user" && raw.type !== "assistant") continue;

    const msg = raw.message ?? raw;
    const role = (msg.role ?? raw.type) as string;

    if (role !== "user" && role !== "assistant") continue;

    const content = msg.content;
    if (!content) continue;

    const { text, toolAction, filePath } = extractContent(
      content as string | ContentBlock[]
    );

    // Skip empty messages, system commands, tool results
    if (!text && !toolAction) continue;

    // Skip system/command messages from user
    if (role === "user" && text.startsWith("Caveat:")) continue;

    messages.push({
      role: role === "user" ? "human" : "assistant",
      content: text,
      toolAction,
      filePath,
    });
  }

  return messages;
}

/**
 * Find .claude JSONL files in a directory listing.
 * Users select the project root, we look for .claude/ folder inside.
 */
export function findClaudeCodeFiles(
  files: File[]
): { conversationFiles: File[]; source: "claude-code" } | null {
  const jsonlFiles = files.filter(
    (f) =>
      f.webkitRelativePath?.includes(".claude/") &&
      f.name.endsWith(".jsonl") &&
      !f.webkitRelativePath.includes("/subagents/")
  );

  if (jsonlFiles.length === 0) return null;

  // Sort by last modified (most recent first)
  jsonlFiles.sort((a, b) => b.lastModified - a.lastModified);

  return { conversationFiles: jsonlFiles, source: "claude-code" };
}
