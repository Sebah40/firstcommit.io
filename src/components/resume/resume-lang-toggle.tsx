"use client";

import { useState } from "react";
import { ResumePdfFrame } from "./resume-pdf-frame";
import { cn } from "@/lib/utils";

type ResumeLink = { label: string; url: string };

function LinkList({ links }: { links: ResumeLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Verify:</span>
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

export function ResumeLangToggle({
  username,
  hasEs,
  links = [],
}: {
  username: string;
  hasEs: boolean;
  links?: ResumeLink[];
}) {
  const [lang, setLang] = useState<"en" | "es">("en");

  if (!hasEs) {
    return (
      <div className="flex h-full flex-col">
        {links.length > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <LinkList links={links} />
          </div>
        )}
        <div className="flex-1">
          <ResumePdfFrame src={`/api/resume/pdf/${username}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border">
        <LinkList links={links} />
        <div className="inline-flex shrink-0 rounded-md border border-border bg-muted/40 p-0.5 text-xs">
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
