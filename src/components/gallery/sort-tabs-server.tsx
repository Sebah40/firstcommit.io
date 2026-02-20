import Link from "next/link";
import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types";

interface SortTabsServerProps {
  active: SortOption;
  query?: string;
}

const TABS: { value: SortOption; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "trending", label: "Trending", icon: Flame },
  { value: "recent", label: "Recent", icon: Clock },
  { value: "popular", label: "Popular", icon: TrendingUp },
];

export function SortTabsServer({ active, query }: SortTabsServerProps) {
  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ value, label, icon: Icon }) => {
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
            {label}
          </Link>
        );
      })}
    </div>
  );
}
