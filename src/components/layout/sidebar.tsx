"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Clock,
  Bookmark,
  Globe,
  Smartphone,
  Server,
  Terminal,
  Brain,
  Gamepad2,
  Zap,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/locales/en";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Globe,
  Smartphone,
  Server,
  Terminal,
  Brain,
  Gamepad2,
  Zap,
  Palette,
};

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  "web-apps": "category.webApps",
  "mobile-apps": "category.mobileApps",
  "apis-backend": "category.apisBackend",
  "cli-tools": "category.cliTools",
  "ai-ml": "category.aiMl",
  "games": "category.games",
  "automation": "category.automation",
  "design-ui": "category.designUi",
};

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { href: "/", label: t("sidebar.home"), icon: Home },
    { href: "/?sort=trending", label: t("sidebar.trending"), icon: Flame },
    { href: "/?sort=recent", label: t("sidebar.recent"), icon: Clock },
    { href: "/saved", label: t("sidebar.saved"), icon: Bookmark },
  ];

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-40",
        "w-60 overflow-y-auto",
        "border-r border-border bg-surface",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      <nav className="flex flex-col p-3">
        {/* Main navigation */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-border" />

        {/* Categories */}
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.categories")}
        </p>
        <div className="space-y-0.5">
          {DEFAULT_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Globe;
            const href = `/category/${cat.slug}`;
            const isActive = pathname === href;
            const catKey = CATEGORY_KEYS[cat.slug];
            return (
              <Link
                key={cat.slug}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {catKey ? t(catKey) : cat.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
