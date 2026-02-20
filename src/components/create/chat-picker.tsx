"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload, X, Check, ChevronDown, ChevronUp, Copy,
  FolderOpen, MessageSquare, Clock, Pencil, Trash2,
  ArrowLeft, Terminal,
} from "lucide-react";
import {
  parseClaudeCodeJsonl,
  type ParsedMessage,
} from "@/lib/parser/claude-code";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface ChatPickerProps {
  messages: ParsedMessage[];
  onChange: (messages: ParsedMessage[]) => void;
}

interface ConversationEntry {
  file: File;
  project: string;
  lastModified: number;
}

interface ProjectGroup {
  name: string;
  conversations: ConversationEntry[];
}

const CLAUDE_PATH = "~/.claude/projects/";

// --- Directory walking helpers ---

function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    reader.readEntries(
      (entries) => resolve(entries),
      () => resolve([])
    );
  });
}

function entryToFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file((f) => resolve(f), () => resolve(null));
  });
}

async function collectFromProjectDir(
  dirEntry: FileSystemDirectoryEntry
): Promise<File[]> {
  const reader = dirEntry.createReader();
  const files: File[] = [];

  let batch = await readEntries(reader);
  while (batch.length > 0) {
    for (const child of batch) {
      if (child.isFile && child.name.endsWith(".jsonl")) {
        const f = await entryToFile(child as FileSystemFileEntry);
        if (f) files.push(f);
      }
    }
    batch = await readEntries(reader);
  }

  return files;
}

async function discoverConversations(
  items: DataTransferItemList
): Promise<ConversationEntry[]> {
  const fsEntries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) fsEntries.push(entry);
  }

  const entries: ConversationEntry[] = [];

  for (const entry of fsEntries) {
    if (entry.isFile && entry.name.endsWith(".jsonl")) {
      const f = await entryToFile(entry as FileSystemFileEntry);
      if (f) {
        entries.push({ file: f, project: "Dropped file", lastModified: f.lastModified });
      }
      continue;
    }

    if (!entry.isDirectory) continue;

    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const allChildren: FileSystemEntry[] = [];
    let batch = await readEntries(reader);
    while (batch.length > 0) {
      allChildren.push(...batch);
      batch = await readEntries(reader);
    }

    const jsonlChildren = allChildren.filter(
      (c) => c.isFile && c.name.endsWith(".jsonl")
    );

    if (jsonlChildren.length > 0) {
      for (const child of jsonlChildren) {
        const f = await entryToFile(child as FileSystemFileEntry);
        if (f) {
          entries.push({ file: f, project: dirEntry.name, lastModified: f.lastModified });
        }
      }
    } else {
      for (const child of allChildren) {
        if (child.isDirectory) {
          const projectFiles = await collectFromProjectDir(
            child as FileSystemDirectoryEntry
          );
          for (const f of projectFiles) {
            entries.push({ file: f, project: child.name, lastModified: f.lastModified });
          }
        }
      }
    }
  }

  return entries;
}

function formatProjectName(encoded: string): string {
  const parts = encoded.replace(/^-/, "").split("-");
  const stopWords = new Set(["users", "home", "documents", "proyectos", "projects", "desktop", "repos", "code", "dev", "src"]);
  let startIdx = 0;
  for (let i = 0; i < parts.length; i++) {
    if (stopWords.has(parts[i].toLowerCase())) {
      startIdx = i + 1;
    }
  }
  const meaningful = parts.slice(startIdx);
  return meaningful.length > 0 ? meaningful.join("-") : encoded;
}

function groupByProject(entries: ConversationEntry[]): ProjectGroup[] {
  const map = new Map<string, ConversationEntry[]>();
  for (const entry of entries) {
    const existing = map.get(entry.project) ?? [];
    existing.push(entry);
    map.set(entry.project, existing);
  }
  return Array.from(map.entries())
    .map(([name, conversations]) => ({
      name,
      conversations: conversations.sort((a, b) => b.lastModified - a.lastModified),
    }))
    .sort((a, b) => b.conversations[0].lastModified - a.conversations[0].lastModified);
}

// --- Message Editor Row ---

function MessageRow({
  msg,
  index,
  onUpdate,
  onRemove,
}: {
  msg: ParsedMessage;
  index: number;
  onUpdate: (index: number, updated: ParsedMessage) => void;
  onRemove: (index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);

  const isHuman = msg.role === "human";
  const hasToolAction = !!msg.toolAction;

  function save() {
    onUpdate(index, { ...msg, content: editText });
    setEditing(false);
  }

  function cancel() {
    setEditText(msg.content);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl p-3 transition-colors",
        isHuman ? "bg-blue-500/5" : "bg-violet-500/5"
      )}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className={cn(
            "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide",
            isHuman
              ? "bg-blue-500/10 text-blue-500"
              : "bg-violet-500/10 text-violet-500"
          )}
        >
          {isHuman ? "You" : "Claude"}
        </div>

        {hasToolAction && (
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            <Terminal size={10} />
            {msg.toolAction}
            {msg.filePath && (
              <span className="ml-0.5 max-w-[200px] truncate font-mono opacity-70">
                {msg.filePath}
              </span>
            )}
          </div>
        )}

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => { setEditText(msg.content); setEditing(true); }}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit message"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Remove message"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={Math.min(editText.split("\n").length + 1, 12)}
            className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90"
            >
              <Check size={12} />
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
          {msg.content || (hasToolAction ? `[${msg.toolAction}] ${msg.filePath ?? ""}` : "...")}
        </p>
      )}
    </div>
  );
}

// --- Main Component ---

export function ChatPicker({ messages, onChange }: ChatPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const [projects, setProjects] = useState<ProjectGroup[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  async function processFile(file: File) {
    try {
      const text = await file.text();
      const parsed = parseClaudeCodeJsonl(text);
      if (parsed.length === 0) {
        setError("This file is empty or couldn't be parsed.");
        setLoading(false);
        return;
      }
      // Keep projects so user can go back
      onChange(parsed);
    } catch {
      setError("Failed to read the conversation file.");
    }
    setLoading(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    await processFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setLoading(true);
    setError("");
    setProjects([]);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const directJsonl = droppedFiles.find((f) => f.name.endsWith(".jsonl"));
    if (directJsonl) {
      await processFile(directJsonl);
      return;
    }

    if (e.dataTransfer.items.length > 0) {
      const entries = await discoverConversations(e.dataTransfer.items);
      if (entries.length > 0) {
        if (entries.length === 1) {
          await processFile(entries[0].file);
          return;
        }
        const grouped = groupByProject(entries);
        setProjects(grouped);
        setExpandedProject(grouped[0].name);
        setLoading(false);
        return;
      }
    }

    setError("No conversations found. Drop the ~/.claude/projects/ folder or a .jsonl file.");
    setLoading(false);
  }, []);

  async function selectConversation(entry: ConversationEntry) {
    setLoading(true);
    setError("");
    await processFile(entry.file);
  }

  async function copyPath() {
    await navigator.clipboard.writeText(CLAUDE_PATH);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function goBackToPicker() {
    onChange([]);
    setError("");
  }

  function clear() {
    onChange([]);
    setProjects([]);
    setExpandedProject(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeProject(name: string) {
    const updated = projects.filter((p) => p.name !== name);
    if (updated.length === 0) {
      clear();
    } else {
      setProjects(updated);
      if (expandedProject === name) {
        setExpandedProject(updated[0].name);
      }
    }
  }

  function removeMessage(index: number) {
    const updated = messages.filter((_, i) => i !== index);
    if (updated.length === 0) {
      goBackToPicker();
    } else {
      onChange(updated);
    }
  }

  function updateMessage(index: number, updated: ParsedMessage) {
    const next = [...messages];
    next[index] = updated;
    onChange(next);
  }

  const humanCount = messages.filter((m) => m.role === "human").length;
  const assistantCount = messages.filter((m) => m.role === "assistant").length;

  // --- Picker view ---
  if (projects.length > 0 && messages.length === 0) {
    const totalConversations = projects.reduce((sum, p) => sum + p.conversations.length, 0);

    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-muted p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-accent" />
              <span className="text-xs font-medium text-foreground">
                {totalConversations} conversations in {projects.length} {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>
            <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {projects.map((project) => {
              const isExpanded = expandedProject === project.name;
              const displayName = formatProjectName(project.name);

              return (
                <div key={project.name}>
                  <div className="group/project flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedProject(isExpanded ? null : project.name)}
                      className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-hover transition-colors min-w-0"
                    >
                      {isExpanded ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
                      <span className="font-medium text-foreground truncate">{displayName}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {project.conversations.length} {project.conversations.length === 1 ? "chat" : "chats"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProject(project.name)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover/project:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Remove project"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-5 space-y-0.5 pb-1">
                      {project.conversations.map((conv, i) => (
                        <button
                          key={conv.file.name}
                          type="button"
                          onClick={() => selectConversation(conv)}
                          disabled={loading}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface-hover transition-colors disabled:opacity-50"
                        >
                          <Clock size={11} className="shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatRelativeTime(new Date(conv.lastModified).toISOString())}
                          </span>
                          <span className="text-muted-foreground/60 truncate">
                            {conv.file.name.replace(".jsonl", "").slice(0, 8)}...
                          </span>
                          {i === 0 && (
                            <span className="ml-auto shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                              latest
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // --- Editor view (conversation loaded) ---
  if (messages.length > 0) {
    return (
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {projects.length > 0 && (
              <button
                type="button"
                onClick={goBackToPicker}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            )}
            <div className="flex items-center gap-2">
              <Check size={14} className="text-green-500" />
              <span className="text-xs font-medium text-foreground">
                {messages.length} messages
              </span>
              <span className="text-xs text-muted-foreground">
                ({humanCount} user, {assistantCount} assistant)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Message list */}
        <div className="max-h-[480px] space-y-2 overflow-y-auto rounded-xl bg-muted p-2">
          {messages.map((msg, i) => (
            <MessageRow
              key={i}
              msg={msg}
              index={i}
              onUpdate={updateMessage}
              onRemove={removeMessage}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Drop zone ---
  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-lg py-8",
          "bg-muted text-muted-foreground",
          "transition-all",
          dragging && "ring-2 ring-accent/50 bg-accent/5 text-foreground",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        {loading ? (
          <span className="text-sm">Scanning conversations...</span>
        ) : (
          <>
            <Upload size={18} className={cn(dragging && "text-accent")} />
            <span className="text-sm">
              {dragging ? "Drop it!" : "Drop your projects folder or a .jsonl file"}
            </span>

            <div className="flex items-center gap-1.5 rounded-md bg-background/50 px-2.5 py-1">
              <code className="text-xs text-muted-foreground">
                {CLAUDE_PATH}
              </code>
              <button
                type="button"
                onClick={copyPath}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy path"
              >
                {copied ? (
                  <Check size={12} className="text-green-500" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Finder: <kbd className="rounded bg-background/50 px-1 font-mono text-[10px]">Cmd+Shift+G</kbd> → paste path → drag the folder here
            </span>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <FolderOpen size={12} />
              or pick a .jsonl file
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".jsonl"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
