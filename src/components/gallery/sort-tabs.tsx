"use client";

import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SortOption } from "@/types";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface SortTabsProps {
  active: SortOption;
  onChange: (sort: SortOption) => void;
}

const TABS: { value: SortOption; labelKey: TranslationKey; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "trending", labelKey: "gallery.trending", icon: Flame },
  { value: "recent", labelKey: "gallery.recent", icon: Clock },
  { value: "popular", labelKey: "gallery.popular", icon: TrendingUp },
];

export function SortTabs({ active, onChange }: SortTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ value, labelKey, icon: Icon }) => (
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
