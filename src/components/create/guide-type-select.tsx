"use client";

import { cn } from "@/lib/utils";
import type { GuideType } from "@/types";

interface GuideTypeSelectProps {
  value: GuideType;
  onChange: (value: GuideType) => void;
}

const OPTIONS: { value: GuideType; label: string }[] = [
  { value: "full_app", label: "Full App" },
  { value: "component", label: "Component" },
  { value: "integration", label: "Integration" },
  { value: "automation", label: "Automation" },
  { value: "game", label: "Game" },
  { value: "cli_tool", label: "CLI Tool" },
  { value: "chrome_extension", label: "Extension" },
  { value: "other", label: "Other" },
];

export function GuideTypeSelect({ value, onChange }: GuideTypeSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
