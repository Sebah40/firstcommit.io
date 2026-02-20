"use client";

import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types";

interface SortTabsProps {
  active: SortOption;
  onChange: (sort: SortOption) => void;
}

const TABS: { value: SortOption; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "trending", label: "Trending", icon: Flame },
  { value: "recent", label: "Recent", icon: Clock },
  { value: "popular", label: "Popular", icon: TrendingUp },
];

export function SortTabs({ active, onChange }: SortTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            active === value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
