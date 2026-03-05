"use client";

import { Grid3X3, MessageCircle, Heart, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { ProfileTab } from "@/types";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface ProfileTabsProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  showLiked: boolean;
  showSaved: boolean;
}

const ALL_TABS: { value: ProfileTab; labelKey: TranslationKey; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "guides", labelKey: "profile.guides", icon: Grid3X3 },
  { value: "comments", labelKey: "profile.comments", icon: MessageCircle },
  { value: "liked", labelKey: "profile.liked", icon: Heart },
  { value: "saved", labelKey: "profile.saved", icon: Bookmark },
];

export function ProfileTabs({ active, onChange, showLiked, showSaved }: ProfileTabsProps) {
  const { t } = useTranslation();

  const tabs = ALL_TABS.filter((tab) => {
    if (tab.value === "liked") return showLiked;
    if (tab.value === "saved") return showSaved;
    return true;
  });

  return (
    <div className="flex items-center gap-1">
      {tabs.map(({ value, labelKey, icon: Icon }) => (
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
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
