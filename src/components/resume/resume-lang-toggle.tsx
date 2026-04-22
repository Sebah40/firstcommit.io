"use client";

import { useState } from "react";
import { ResumePdfFrame } from "./resume-pdf-frame";
import { cn } from "@/lib/utils";

export function ResumeLangToggle({
  username,
  hasEs,
}: {
  username: string;
  hasEs: boolean;
}) {
  const [lang, setLang] = useState<"en" | "es">("en");

  if (!hasEs) {
    return <ResumePdfFrame src={`/api/resume/pdf/${username}`} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end gap-1 px-2 py-2">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                lang === l
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <ResumePdfFrame src={`/api/resume/pdf/${username}?lang=${lang}`} />
      </div>
    </div>
  );
}
