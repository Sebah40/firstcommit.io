"use client";

import { useState } from "react";
import { Bold, Italic, Code, Heading2, Link2, Eye, EyeOff } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface MarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

interface ToolbarButton {
  icon: typeof Bold;
  title: string;
  prefix: string;
  suffix: string;
}

const TOOLBAR: ToolbarButton[] = [
  { icon: Bold, title: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, title: "Italic", prefix: "*", suffix: "*" },
  { icon: Code, title: "Code", prefix: "`", suffix: "`" },
  { icon: Heading2, title: "Heading", prefix: "## ", suffix: "" },
  { icon: Link2, title: "Link", prefix: "[", suffix: "](url)" },
];

export function MarkdownField({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
}: MarkdownFieldProps) {
  const [preview, setPreview] = useState(false);

  function insertFormat(prefix: string, suffix: string) {
    const textarea = document.querySelector(
      `[data-md-field="${label ?? "md"}"]`
    ) as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = prefix + (selected || "text") + suffix;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + (selected || "text").length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {/* Toolbar */}
      <div className="mb-1.5 flex items-center gap-0.5">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={() => insertFormat(btn.prefix, btn.suffix)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={btn.title}
          >
            <btn.icon size={14} />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
            preview
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div
          className="min-h-[80px] rounded-lg bg-muted px-4 py-3 text-sm text-foreground prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          data-md-field={label ?? "md"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "w-full resize-none rounded-lg bg-muted px-4 py-3 text-sm outline-none",
            "text-foreground placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-accent/30 transition-shadow font-mono"
          )}
        />
      )}
    </div>
  );
}
