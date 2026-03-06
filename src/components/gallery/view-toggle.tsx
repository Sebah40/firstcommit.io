"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export type ViewType = "grid" | "feed";

interface ViewToggleProps {
    view: ViewType;
}

export function ViewToggle({ view }: ViewToggleProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setView = (newView: ViewType) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", newView);
        router.replace(`/?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex items-center rounded-lg bg-muted/40 p-1 border border-border/40">
            <button
                onClick={() => setView("grid")}
                className={cn(
                    "relative flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
                    view === "grid" && "text-foreground"
                )}
                title="Grid View"
            >
                {view === "grid" && (
                    <motion.div
                        layoutId="viewToggle"
                        className="absolute inset-0 rounded-md bg-background shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <LayoutGrid size={16} className="relative z-10" />
            </button>

            <button
                onClick={() => setView("feed")}
                className={cn(
                    "relative flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
                    view === "feed" && "text-foreground"
                )}
                title="Feed View"
            >
                {view === "feed" && (
                    <motion.div
                        layoutId="viewToggle"
                        className="absolute inset-0 rounded-md bg-background shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Rows3 size={16} className="relative z-10" />
            </button>
        </div>
    );
}
