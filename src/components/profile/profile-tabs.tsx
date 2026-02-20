"use client";

import { Grid3X3, MessageCircle, Heart, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileTab } from "@/types";

interface ProfileTabsProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  showLiked: boolean;
  showSaved: boolean;
}

const ALL_TABS: { value: ProfileTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "guides", label: "Guides", icon: Grid3X3 },
  { value: "comments", label: "Comments", icon: MessageCircle },
  { value: "liked", label: "Liked", icon: Heart },
  { value: "saved", label: "Saved", icon: Bookmark },
];

export function ProfileTabs({ active, onChange, showLiked, showSaved }: ProfileTabsProps) {
  const tabs = ALL_TABS.filter((tab) => {
    if (tab.value === "liked") return showLiked;
    if (tab.value === "saved") return showSaved;
    return true;
  });

  return (
    <div className="flex items-center gap-1">
      {tabs.map(({ value, label, icon: Icon }) => (
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
