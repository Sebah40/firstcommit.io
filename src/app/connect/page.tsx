"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  Upload,
  Search,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/locales/en";

const COMMAND = "claude mcp add --transport http firstcommit https://firstcommit.io/api/mcp";

const tools: { name: string; descKey: TranslationKey; icon: typeof Upload }[] = [
  { name: "firstcommit_publish", descKey: "connect.toolPublish", icon: Upload },
  { name: "firstcommit_search", descKey: "connect.toolSearch", icon: Search },
];

export default function ConnectPage() {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const steps = [
    { number: 1, title: t("connect.step1Title"), description: t("connect.step1Desc") },
    { number: 2, title: t("connect.step2Title"), description: t("connect.step2Desc") },
    { number: 3, title: t("connect.step3Title"), description: t("connect.step3Desc") },
  ];

  async function handleCopy() {
    await navigator.clipboard.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Terminal size={28} className="text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("connect.title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t("connect.subtitle")}
        </p>
      </div>

      {/* Command block */}
      <div className="mt-10 rounded-xl bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between gap-3">
          <code className="flex-1 overflow-x-auto text-sm text-green-400 font-mono whitespace-nowrap scrollbar-none">
            <span className="text-neutral-500 select-none">$ </span>
            {COMMAND}
          </code>
          <button
            onClick={handleCopy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Copy command"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-16">
        <h2 className="text-lg font-semibold text-foreground">{t("connect.howItWorks")}</h2>
        <div className="mt-6 space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {step.number}
              </div>
              <div className="pt-0.5">
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example prompt */}
      <div className="mt-12 rounded-xl bg-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Try it</h3>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] px-4 py-3">
          <p className="text-sm font-mono text-green-400">
            {t("connect.examplePrompt")}
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("connect.exampleDesc")}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          {t("connect.browseGuides")}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Tools */}
      <div className="mt-16">
        <h2 className="text-lg font-semibold text-foreground">
          {t("connect.availableTools")}
        </h2>
        <div className="mt-6 space-y-2">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center gap-3 rounded-xl bg-surface p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <tool.icon size={16} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium font-mono text-foreground">
                  {tool.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(tool.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
