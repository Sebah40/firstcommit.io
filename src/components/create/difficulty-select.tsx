"use client";

import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";

interface DifficultySelectProps {
  value: Difficulty | null;
  onChange: (value: Difficulty | null) => void;
}

const OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: "beginner", label: "Beginner", color: "bg-green-500/10 text-green-500" },
  { value: "intermediate", label: "Intermediate", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "advanced", label: "Advanced", color: "bg-red-500/10 text-red-500" },
];

export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? opt.color
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
