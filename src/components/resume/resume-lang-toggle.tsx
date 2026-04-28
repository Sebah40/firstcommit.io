"use client";

import { useState } from "react";
import { Download } from "lucide-react";
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

function DownloadButton({ username, lang }: { username: string; lang: "en" | "es" }) {
  const href = `/api/resume/pdf/${username}?lang=${lang}&download=1`;
  return (
    <a
      href={href}
      download={`${username}-resume-${lang}.pdf`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      title="Download PDF"
    >
      <Download size={12} />
      <span>Download</span>
    </a>
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
  const pdfSrc = `/api/resume/pdf/${username}${hasEs ? `?lang=${lang}` : ""}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-border">
        <LinkList links={links} />
        <div className="flex items-center gap-2">
          {hasEs && (
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
          )}
          <DownloadButton username={username} lang={hasEs ? lang : "en"} />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResumePdfFrame src={pdfSrc} />
      </div>
    </div>
  );
}
