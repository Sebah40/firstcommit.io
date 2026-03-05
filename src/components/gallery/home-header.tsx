"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import { motion } from "framer-motion";

interface HomeHeaderProps {
  query?: string;
  count: number;
}

export function HomeHeader({ query, count }: HomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
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
    </motion.div>
  );
}
