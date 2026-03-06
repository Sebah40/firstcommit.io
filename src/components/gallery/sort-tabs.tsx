"use client";

import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SortOption } from "@/types";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { motion } from "framer-motion";

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
    <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1">
      {TABS.map(({ value, labelKey, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {active === value && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute inset-0 rounded-full bg-background shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icon size={14} />
            {t(labelKey)}
          </span>
        </button>
      ))}
    </div>
  );
}
