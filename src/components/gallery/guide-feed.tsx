"use client";

import { GuideFeedCard } from "./guide-feed-card";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Guide } from "@/types";
import { motion } from "framer-motion";

interface GuideFeedProps {
    guides: Guide[];
}

export function GuideFeed({ guides }: GuideFeedProps) {
    const { t } = useTranslation();

    if (guides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted"
                >
                    <span className="text-3xl">🚀</span>
                </motion.div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("gallery.noGuides")}
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {t("gallery.noGuidesDesc")}
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {guides.map((guide) => (
                <GuideFeedCard key={guide.id} guide={guide} />
            ))}
        </div>
    );
}
