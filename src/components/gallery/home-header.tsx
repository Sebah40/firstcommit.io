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
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
      >
        {query ? t("gallery.resultsFor", { query }) : t("gallery.explore")}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-2 text-base text-muted-foreground max-w-xl"
      >
        {query
          ? t("gallery.guidesFound", {
            count,
            plural: count !== 1 ? "s" : "",
          })
          : t("gallery.subtitle")}
      </motion.p>
    </motion.div>
  );
}
