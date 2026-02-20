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

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?sort=trending", label: "Trending", icon: Flame },
  { href: "/?sort=recent", label: "Recent", icon: Clock },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

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
                key={label}
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
          Categories
        </p>
        <div className="space-y-0.5">
          {DEFAULT_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Globe;
            const href = `/category/${cat.slug}`;
            const isActive = pathname === href;
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
                {cat.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
