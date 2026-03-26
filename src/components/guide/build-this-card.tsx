"use client";

import { useState } from "react";
import { Hammer, Copy, Check, Github, Terminal } from "lucide-react";

interface BuildThisCardProps {
  guideId: string;
  guideTitle: string;
  repoUrl: string | null;
  stageCount: number;
}

export function BuildThisCard({ guideId, guideTitle, repoUrl, stageCount }: BuildThisCardProps) {
  const [copied, setCopied] = useState(false);

  const prompt = `Build the project from this First Commit guide: ${guideId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] via-transparent to-violet-500/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
          <Hammer size={14} className="text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Build This</h3>
          <p className="text-[11px] text-muted-foreground">
            {stageCount} stages to follow
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        Paste this in your AI coding tool to build your own version, guided by the approach in this guide.
      </p>

      {/* Prompt to copy */}
      <div className="mb-3 rounded-lg bg-[#0a0a0a] border border-white/[0.06] p-3">
        <div className="flex items-start justify-between gap-2">
          <code className="text-xs text-green-400 font-mono leading-relaxed break-all">
            {prompt}
          </code>
          <button
            onClick={handleCopy}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Copy prompt"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Repo link */}
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Github size={14} className="text-muted-foreground" />
          <span className="truncate">{repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>
        </a>
      )}

      {!repoUrl && (
        <p className="text-[11px] text-muted-foreground/60 italic">
          No source repo linked — follow the guide stages to build from scratch.
        </p>
      )}

      {/* Setup hint */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
        <Terminal size={10} />
        <span>Requires <a href="/connect" className="text-accent hover:underline">First Commit MCP</a> connected</span>
      </div>
    </div>
  );
}
