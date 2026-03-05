"use client";

import { GuideCard } from "./guide-card";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Guide } from "@/types";
import { motion } from "framer-motion";

interface GuideGridProps {
  guides: Guide[];
}

export function GuideGrid({ guides }: GuideGridProps) {
  const { t } = useTranslation();

  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <span className="text-3xl">🚀</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {t("gallery.noGuides")}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("gallery.noGuidesDesc")}
        </p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {guides.map((guide) => (
        <GuideCard key={guide.id} guide={guide} />
      ))}
    </motion.div>
  );
}
