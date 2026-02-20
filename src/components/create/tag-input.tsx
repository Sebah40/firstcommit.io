"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
}

export function TagInput({ tags, onChange, placeholder = "Add tech...", max = 8 }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const tag = value.trim();
    if (!tag || tags.includes(tag) || tags.length >= max) return;
    onChange([...tags, tag]);
    setInput("");
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/30 transition-shadow">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-accent/60 hover:text-accent"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className={cn(
            "flex-1 min-w-[80px] bg-transparent text-sm outline-none",
            "text-foreground placeholder:text-muted-foreground"
          )}
        />
      )}
    </div>
  );
}
