"use client";

import Link from "next/link";
import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SortOption } from "@/types";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface SortTabsServerProps {
  active: SortOption;
  query?: string;
}

const TABS: { value: SortOption; labelKey: TranslationKey; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "trending", labelKey: "gallery.trending", icon: Flame },
  { value: "recent", labelKey: "gallery.recent", icon: Clock },
  { value: "popular", labelKey: "gallery.popular", icon: TrendingUp },
];

export function SortTabsServer({ active, query }: SortTabsServerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ value, labelKey, icon: Icon }) => {
        const params = new URLSearchParams();
        if (value !== "trending") {
          params.set("sort", value);
        }
        if (query) {
          params.set("q", query);
        }
        const href = params.toString() ? `/?${params.toString()}` : "/";

        return (
          <Link
            key={value}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active === value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} />
            {t(labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
