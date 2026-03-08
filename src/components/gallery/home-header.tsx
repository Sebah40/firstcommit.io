"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

interface HomeHeaderProps {
  query?: string;
  count: number;
}

export function HomeHeader({ query, count }: HomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        {query ? t("gallery.resultsFor", { query }) : t("gallery.explore")}
      </h1>
      <p className="mt-2 text-base text-muted-foreground max-w-xl">
        {query
          ? t("gallery.guidesFound", {
            count,
            plural: count !== 1 ? "s" : "",
          })
          : t("gallery.subtitle")}
      </p>
    </div>
  );
}
