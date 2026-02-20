"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  MessageSquare,
  Terminal,
  ChevronDown,
  ChevronRight,
  User,
  Bot,
  Star,
  PenLine,
  Plus,
  X,
  Trash2,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  upsertAnnotation,
  deleteAnnotation,
  toggleStar,
  createChapter,
  updateChapter,
  deleteChapter,
} from "@/lib/supabase/queries/guide-detail";
import type { ChatMessage, TimelineChapter } from "@/types";

interface ChatTimelineProps {
  messages: ChatMessage[];
  chapters?: TimelineChapter[];
  isOwner?: boolean;
  postId?: string;
}

const INITIAL_DISPLAY = 20;
const COLLAPSE_THRESHOLD = 50;
const LONG_MESSAGE_CHARS = 300;

type Filter = "all" | "human" | "assistant" | "tool";

export function ChatTimeline({
  messages: initialMessages,
  chapters: initialChapters,
  isOwner = false,
  postId,
}: ChatTimelineProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [chapters, setChapters] = useState(initialChapters ?? []);
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState("");
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<TimelineChapter | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const starredMessages = useMemo(
    () => messages.filter((m) => m.is_starred),
    [messages]
  );

  const filteredMessages = useMemo(() => {
    if (filter === "all") return messages;
    if (filter === "tool") return messages.filter((m) => m.tool_action);
    return messages.filter((m) => m.role === filter && !m.tool_action);
  }, [messages, filter]);

  const counts = useMemo(
    () => ({
      human: messages.filter((m) => m.role === "human").length,
      assistant: messages.filter((m) => m.role === "assistant" && !m.tool_action).length,
      tool: messages.filter((m) => m.tool_action).length,
    }),
    [messages]
  );

  // Build a map of order → chapter for rendering chapter headers
  const chapterByStartOrder = useMemo(() => {
    const map = new Map<number, TimelineChapter>();
    for (const ch of chapters) {
      map.set(ch.start_order, ch);
    }
    return map;
  }, [chapters]);

  // Build set of collapsed message orders
  const collapsedOrders = useMemo(() => {
    const orders = new Set<number>();
    for (const ch of chapters) {
      if (collapsedChapters.has(ch.id)) {
        for (let o = ch.start_order; o <= ch.end_order; o++) {
          orders.add(o);
        }
      }
    }
    return orders;
  }, [chapters, collapsedChapters]);

  // Group consecutive tool-only messages
  type GroupedItem =
    | { type: "message"; message: ChatMessage }
    | { type: "tool-group"; messages: ChatMessage[] }
    | { type: "chapter-header"; chapter: TimelineChapter };

  const groupedItems = useMemo(() => {
    const items: GroupedItem[] = [];
    let toolBuffer: ChatMessage[] = [];

    function flushTools() {
      if (toolBuffer.length > 0) {
        items.push({ type: "tool-group", messages: [...toolBuffer] });
        toolBuffer = [];
      }
    }

    for (const msg of filteredMessages) {
      // Skip messages in collapsed chapters
      if (collapsedOrders.has(msg.order)) continue;

      // Insert chapter header if this message starts a chapter
      const chapter = chapterByStartOrder.get(msg.order);
      if (chapter) {
        flushTools();
        items.push({ type: "chapter-header", chapter });
      }

      const isToolOnly = msg.tool_action && !msg.content.trim();
      if (isToolOnly) {
        toolBuffer.push(msg);
      } else {
        flushTools();
        items.push({ type: "message", message: msg });
      }
    }
    flushTools();

    return items;
  }, [filteredMessages, chapterByStartOrder, collapsedOrders]);

  // Also insert chapter headers for collapsed chapters (so we can show the collapsed header)
  const displayGroupedItems = useMemo(() => {
    if (collapsedChapters.size === 0) return groupedItems;

    // We need to add collapsed chapter headers in the right position
    const collapsedHeaders: GroupedItem[] = [];
    for (const ch of chapters) {
      if (collapsedChapters.has(ch.id)) {
        collapsedHeaders.push({ type: "chapter-header", chapter: ch });
      }
    }
    if (collapsedHeaders.length === 0) return groupedItems;

    // Merge collapsed headers into the list at the right position
    const result: GroupedItem[] = [];
    let collapsedIdx = 0;
    const sortedCollapsed = [...chapters]
      .filter((ch) => collapsedChapters.has(ch.id))
      .sort((a, b) => a.start_order - b.start_order);

    // Walk through all items and insert collapsed headers at correct positions
    let lastOrder = -1;
    for (const item of groupedItems) {
      const itemOrder =
        item.type === "message"
          ? item.message.order
          : item.type === "tool-group"
          ? item.messages[0].order
          : item.chapter.start_order;

      // Insert any collapsed chapter headers that come before this item
      while (
        collapsedIdx < sortedCollapsed.length &&
        sortedCollapsed[collapsedIdx].start_order < itemOrder &&
        sortedCollapsed[collapsedIdx].start_order > lastOrder
      ) {
        result.push({
          type: "chapter-header",
          chapter: sortedCollapsed[collapsedIdx],
        });
        collapsedIdx++;
      }

      lastOrder = itemOrder;
      result.push(item);
    }

    // Append any remaining collapsed headers
    while (collapsedIdx < sortedCollapsed.length) {
      result.push({
        type: "chapter-header",
        chapter: sortedCollapsed[collapsedIdx],
      });
      collapsedIdx++;
    }

    return result;
  }, [groupedItems, chapters, collapsedChapters]);

  const shouldTruncateList =
    filteredMessages.length > COLLAPSE_THRESHOLD && !expandedAll;
  const displayItems = shouldTruncateList
    ? displayGroupedItems.slice(0, INITIAL_DISPLAY)
    : displayGroupedItems;

  function toggleMessageExpand(id: string) {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleChapterCollapse(chapterId: string) {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  function scrollToMessage(messageId: string) {
    const el = messageRefs.current.get(messageId);
    if (el) {
      // Uncollapse any chapter that contains this message
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        for (const ch of chapters) {
          if (
            msg.order >= ch.start_order &&
            msg.order <= ch.end_order &&
            collapsedChapters.has(ch.id)
          ) {
            setCollapsedChapters((prev) => {
              const next = new Set(prev);
              next.delete(ch.id);
              return next;
            });
          }
        }
      }
      // Expand all if list is truncated
      if (shouldTruncateList) setExpandedAll(true);

      setTimeout(() => {
        const target = messageRefs.current.get(messageId);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }

  // Star toggle handler
  const handleToggleStar = useCallback(
    async (msg: ChatMessage) => {
      if (!postId) return;
      const wasStarred = !!msg.is_starred;

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, is_starred: !wasStarred } : m
        )
      );

      await toggleStar(msg.id, postId, wasStarred);
    },
    [postId]
  );

  // Annotation handlers
  const handleStartAnnotation = useCallback(
    (msg: ChatMessage) => {
      setEditingAnnotation(msg.id);
      setAnnotationDraft(msg.annotation?.content ?? "");
    },
    []
  );

  const handleSaveAnnotation = useCallback(
    async (messageId: string) => {
      if (!postId || !annotationDraft.trim()) return;

      const content = annotationDraft.trim();

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                annotation: {
                  id: m.annotation?.id ?? "temp",
                  message_id: messageId,
                  post_id: postId,
                  content,
                  created_at: new Date().toISOString(),
                },
              }
            : m
        )
      );
      setEditingAnnotation(null);
      setAnnotationDraft("");

      await upsertAnnotation(messageId, postId, content);
    },
    [postId, annotationDraft]
  );

  const handleDeleteAnnotation = useCallback(
    async (messageId: string) => {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, annotation: undefined } : m
        )
      );

      await deleteAnnotation(messageId);
    },
    []
  );

  if (messages.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare size={18} className="text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          How it was made
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {messages.length}
        </span>
      </div>

      {/* Key Moments Strip */}
      {starredMessages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">
              Key moments
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {starredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => scrollToMessage(msg.id)}
                className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Star size={10} className="fill-current" />
                <span className="max-w-[200px] truncate">
                  {msg.content.slice(0, 30)}
                  {msg.content.length > 30 ? "..." : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            { key: "all", label: "All", count: messages.length, icon: null },
            {
              key: "human",
              label: "You",
              count: counts.human,
              icon: <User size={13} />,
            },
            {
              key: "assistant",
              label: "Claude",
              count: counts.assistant,
              icon: <Bot size={13} />,
            },
            {
              key: "tool",
              label: "Bash",
              count: counts.tool,
              icon: <Terminal size={13} />,
            },
          ] as const
        ).map(({ key, label, count, icon }) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              setExpandedAll(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === key
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {icon}
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                filter === key ? "bg-accent-foreground/20" : "bg-background/50"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Add Chapter button (owner only) */}
      {isOwner && postId && (
        <div className="mb-4">
          <button
            onClick={() => {
              setEditingChapter(null);
              setShowChapterModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={13} />
            Add chapter
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative ml-3">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-muted" />

        <div className="flex flex-col gap-4">
          {displayItems.map((item, idx) => {
            if (item.type === "chapter-header") {
              const ch = item.chapter;
              const isCollapsed = collapsedChapters.has(ch.id);
              return (
                <ChapterHeader
                  key={`ch-${ch.id}`}
                  chapter={ch}
                  isCollapsed={isCollapsed}
                  isOwner={isOwner}
                  onToggleCollapse={() => toggleChapterCollapse(ch.id)}
                  onEdit={() => {
                    setEditingChapter(ch);
                    setShowChapterModal(true);
                  }}
                  onDelete={async () => {
                    await deleteChapter(ch.id);
                    setChapters((prev) =>
                      prev.filter((c) => c.id !== ch.id)
                    );
                  }}
                />
              );
            }

            if (item.type === "tool-group") {
              return (
                <ToolGroup key={`tg-${idx}`} messages={item.messages} />
              );
            }

            const msg = item.message;
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwner={isOwner}
                expandedMessages={expandedMessages}
                editingAnnotation={editingAnnotation}
                annotationDraft={annotationDraft}
                messageRefs={messageRefs}
                onToggleExpand={toggleMessageExpand}
                onToggleStar={() => handleToggleStar(msg)}
                onStartAnnotation={() => handleStartAnnotation(msg)}
                onSaveAnnotation={() => handleSaveAnnotation(msg.id)}
                onDeleteAnnotation={() => handleDeleteAnnotation(msg.id)}
                onCancelAnnotation={() => {
                  setEditingAnnotation(null);
                  setAnnotationDraft("");
                }}
                onAnnotationDraftChange={setAnnotationDraft}
              />
            );
          })}
        </div>

        {/* Show all button */}
        {shouldTruncateList && (
          <div className="relative mt-4 pl-6">
            <button
              onClick={() => setExpandedAll(true)}
              className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
            >
              <ChevronDown size={14} />
              Show all {filteredMessages.length} messages
            </button>
          </div>
        )}
      </div>

      {/* Chapter Modal */}
      {showChapterModal && postId && (
        <ChapterModal
          chapter={editingChapter}
          messages={messages}
          postId={postId}
          onClose={() => {
            setShowChapterModal(false);
            setEditingChapter(null);
          }}
          onSaved={(ch) => {
            if (editingChapter) {
              setChapters((prev) =>
                prev
                  .map((c) => (c.id === ch.id ? ch : c))
                  .sort((a, b) => a.start_order - b.start_order)
              );
            } else {
              setChapters((prev) =>
                [...prev, ch].sort((a, b) => a.start_order - b.start_order)
              );
            }
            setShowChapterModal(false);
            setEditingChapter(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function MessageBubble({
  msg,
  isOwner,
  expandedMessages,
  editingAnnotation,
  annotationDraft,
  messageRefs,
  onToggleExpand,
  onToggleStar,
  onStartAnnotation,
  onSaveAnnotation,
  onDeleteAnnotation,
  onCancelAnnotation,
  onAnnotationDraftChange,
}: {
  msg: ChatMessage;
  isOwner: boolean;
  expandedMessages: Set<string>;
  editingAnnotation: string | null;
  annotationDraft: string;
  messageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onToggleExpand: (id: string) => void;
  onToggleStar: () => void;
  onStartAnnotation: () => void;
  onSaveAnnotation: () => void;
  onDeleteAnnotation: () => void;
  onCancelAnnotation: () => void;
  onAnnotationDraftChange: (v: string) => void;
}) {
  const isHuman = msg.role === "human";
  const isLong = msg.content.length > LONG_MESSAGE_CHARS;
  const isExpanded = expandedMessages.has(msg.id);
  const isStarred = !!msg.is_starred;
  const isEditingAnnotation = editingAnnotation === msg.id;

  return (
    <div
      ref={(el) => {
        if (el) messageRefs.current.set(msg.id, el);
      }}
      className="relative pl-6"
    >
      {/* Dot */}
      <div
        className={cn(
          "absolute left-0 top-4 h-2.5 w-2.5 -translate-x-[4.5px] rounded-full",
          isStarred
            ? "bg-amber-500"
            : isHuman
            ? "bg-blue-500"
            : "bg-violet-500"
        )}
      />

      {/* Bubble */}
      <div
        className={cn(
          "rounded-xl p-4 relative group",
          isStarred
            ? "bg-amber-500/5 ring-1 ring-amber-500/20"
            : isHuman
            ? "bg-blue-500/5"
            : "bg-violet-500/5"
        )}
      >
        {/* Owner controls */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleStar}
              className={cn(
                "rounded-full p-1.5 transition-colors",
                isStarred
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isStarred ? "Remove star" : "Star this message"}
            >
              <Star
                size={14}
                className={isStarred ? "fill-amber-500" : ""}
              />
            </button>
            <button
              onClick={onStartAnnotation}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Add annotation"
            >
              <PenLine size={14} />
            </button>
          </div>
        )}

        {/* Role badge */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              isHuman
                ? "bg-blue-500/10 text-blue-500"
                : "bg-violet-500/10 text-violet-500"
            )}
          >
            {isHuman ? "You" : "Claude"}
          </span>

          {msg.tool_action && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Terminal size={12} />
              <span>{msg.tool_action}</span>
              {msg.file_path && (
                <code className="font-mono text-[11px] text-muted-foreground/70">
                  {msg.file_path}
                </code>
              )}
            </span>
          )}

          {isStarred && (
            <Star
              size={12}
              className="text-amber-500 fill-amber-500"
            />
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "text-sm text-foreground whitespace-pre-wrap break-words",
            isLong && !isExpanded && "line-clamp-4"
          )}
        >
          {msg.content}
        </div>

        {isLong && (
          <button
            onClick={() => onToggleExpand(msg.id)}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Annotation display */}
      {msg.annotation && !isEditingAnnotation && (
        <div className="mt-2 ml-4 rounded-lg bg-amber-500/5 px-3 py-2 relative group/ann">
          <div className="flex items-center gap-1.5 mb-1">
            <PenLine size={11} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Author note
            </span>
          </div>
          <p className="text-sm text-foreground">{msg.annotation.content}</p>
          {isOwner && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/ann:opacity-100 transition-opacity">
              <button
                onClick={onStartAnnotation}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit annotation"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={onDeleteAnnotation}
                className="rounded-full p-1 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete annotation"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Annotation editor */}
      {isEditingAnnotation && (
        <div className="mt-2 ml-4">
          <textarea
            value={annotationDraft}
            onChange={(e) => onAnnotationDraftChange(e.target.value)}
            placeholder="Add a note about this message..."
            className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            rows={2}
            autoFocus
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              onClick={onSaveAnnotation}
              disabled={!annotationDraft.trim()}
              className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={onCancelAnnotation}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterHeader({
  chapter,
  isCollapsed,
  isOwner,
  onToggleCollapse,
  onEdit,
  onDelete,
}: {
  chapter: TimelineChapter;
  isCollapsed: boolean;
  isOwner: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative pl-6">
      {/* Diamond marker */}
      <div className="absolute left-0 top-1/2 h-3 w-3 -translate-x-[5.5px] -translate-y-1/2 rotate-45 bg-accent" />

      <div className="flex items-center gap-2 py-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
          {chapter.title}
        </button>

        {isCollapsed && (
          <span className="text-xs text-muted-foreground">
            ({chapter.end_order - chapter.start_order + 1} messages)
          </span>
        )}

        {isOwner && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit chapter"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-full p-1 text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete chapter"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Divider line */}
      <div className="h-px bg-muted" />
    </div>
  );
}

function ToolGroup({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="relative pl-6">
      {/* Dot */}
      <div className="absolute left-0 top-2 h-2 w-2 -translate-x-[3.5px] rounded-full bg-violet-500/50" />

      <div className="flex flex-wrap gap-1.5">
        {messages.map((msg) => (
          <span
            key={msg.id}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            <Terminal size={11} />
            <span>{msg.tool_action}</span>
            {msg.file_path && (
              <code className="font-mono text-[10px] text-muted-foreground/60">
                {msg.file_path}
              </code>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Chapter Modal
// ============================================

function ChapterModal({
  chapter,
  messages,
  postId,
  onClose,
  onSaved,
}: {
  chapter: TimelineChapter | null;
  messages: ChatMessage[];
  postId: string;
  onClose: () => void;
  onSaved: (ch: TimelineChapter) => void;
}) {
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [startOrder, setStartOrder] = useState(
    chapter?.start_order ?? messages[0]?.order ?? 0
  );
  const [endOrder, setEndOrder] = useState(
    chapter?.end_order ?? messages[messages.length - 1]?.order ?? 0
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const orderOptions = useMemo(
    () => messages.map((m) => m.order),
    [messages]
  );

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (startOrder > endOrder) {
      setError("Start must be before or equal to end");
      return;
    }

    setSaving(true);
    setError("");

    if (chapter) {
      const ok = await updateChapter(chapter.id, {
        title: title.trim(),
        start_order: startOrder,
        end_order: endOrder,
      });
      if (ok) {
        onSaved({
          ...chapter,
          title: title.trim(),
          start_order: startOrder,
          end_order: endOrder,
        });
      }
    } else {
      const created = await createChapter(
        postId,
        title.trim(),
        startOrder,
        endOrder
      );
      if (created) {
        onSaved(created);
      }
    }

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            {chapter ? "Edit chapter" : "New chapter"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Start message
              </label>
              <select
                value={startOrder}
                onChange={(e) => setStartOrder(Number(e.target.value))}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {orderOptions.map((order) => (
                  <option key={order} value={order}>
                    #{order}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                End message
              </label>
              <select
                value={endOrder}
                onChange={(e) => setEndOrder(Number(e.target.value))}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {orderOptions.map((order) => (
                  <option key={order} value={order}>
                    #{order}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : chapter ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
