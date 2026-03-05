"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  Upload,
  Search,
  ArrowRight,
  MessageSquare,
  Zap,
  GitBranch,
  FileCode,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/locales/en";

const COMMAND = "claude mcp add --transport http firstcommit https://firstcommit.io/api/mcp";

const tools: { name: string; descKey: TranslationKey; icon: typeof Upload }[] = [
  { name: "firstcommit_publish", descKey: "connect.toolPublish", icon: Upload },
  { name: "firstcommit_search", descKey: "connect.toolSearch", icon: Search },
];

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timeout = setTimeout(
      () => setDisplayed(text.slice(0, displayed.length + 1)),
      30 + Math.random() * 30
    );
    return () => clearTimeout(timeout);
  }, [displayed, started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="animate-pulse text-accent">|</span>
      )}
    </span>
  );
}

function TerminalDemo() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2500),
      setTimeout(() => setStep(2), 4200),
      setTimeout(() => setStep(3), 5800),
      setTimeout(() => setStep(4), 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] overflow-hidden shadow-2xl shadow-accent/10">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-2 text-xs text-neutral-500 font-mono">~/my-project</span>
      </div>

      {/* Terminal content */}
      <div className="p-5 font-mono text-sm space-y-3 min-h-[220px]">
        <div className="text-green-400">
          <span className="text-neutral-500 select-none">$ </span>
          <TypewriterText text="publish this project to First Commit" delay={800} />
        </div>

        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-neutral-400 space-y-1"
          >
            <p className="text-accent">{t("connect.terminalReading")}</p>
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <p className="text-neutral-400">{t("connect.terminalFound")} <span className="text-white">847</span> {t("connect.terminalMessages")} <span className="text-white">5</span> {t("connect.terminalSessions")}</p>
            <p className="text-neutral-400">{t("connect.terminalDetected")} <span className="text-yellow-400">Next.js</span> <span className="text-cyan-400">TypeScript</span> <span className="text-green-400">Supabase</span></p>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <p className="text-neutral-400">{t("connect.terminalCrafting")}</p>
          </motion.div>
        )}

        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <p className="text-green-400">{t("connect.terminalPublished")} <span className="text-accent underline">firstcommit.io/guide/abc123</span></p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  async function handleCopy() {
    await navigator.clipboard.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="-mx-4 -my-6 sm:-mx-6">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-accent/15 rounded-full blur-[120px]" />
          <div className="absolute top-32 right-1/4 h-[200px] w-[400px] bg-violet-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
              <Sparkles size={14} />
              {t("connect.badge")}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("connect.heroTitle")}{" "}
              <span className="bg-gradient-to-r from-accent via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {t("connect.heroHighlight")}
              </span>
            </h1>

            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto sm:text-xl">
              {t("connect.heroDesc")}
            </p>
          </motion.div>

          {/* Terminal demo */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 mx-auto max-w-2xl"
          >
            <TerminalDemo />
          </motion.div>
        </div>
      </section>

      {/* Setup command */}
      <section className="px-4 sm:px-6 pb-20">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {t("connect.getStarted")}
          </h2>

          <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <code className="flex-1 overflow-x-auto text-sm text-green-400 font-mono whitespace-nowrap scrollbar-none">
                <span className="text-neutral-500 select-none">$ </span>
                {COMMAND}
              </code>
              <button
                onClick={handleCopy}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Copy command"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            {t("connect.setupHint")}{" "}
            <span className="font-mono text-accent">&quot;{t("connect.setupPrompt")}&quot;</span>.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl mb-4">
            {t("connect.howItWorks")}
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            {t("connect.howItWorksDesc")}
          </p>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Terminal,
                step: "01",
                title: t("connect.step1Title"),
                desc: t("connect.step1Desc"),
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Zap,
                step: "02",
                title: t("connect.step2Title"),
                desc: t("connect.step2Desc"),
                color: "from-accent to-violet-500",
              },
              {
                icon: Sparkles,
                step: "03",
                title: t("connect.step3Title"),
                desc: t("connect.step3Desc"),
                color: "from-fuchsia-500 to-pink-500",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="relative rounded-2xl bg-surface border border-border/40 p-6 hover:border-accent/30 transition-colors"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} mb-4`}>
                  <s.icon size={20} className="text-white" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">{t("connect.step")} {s.step}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What gets published */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl mb-4">
            {t("connect.whatGetsPublished")}
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            {t("connect.whatGetsPublishedDesc")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: MessageSquare,
                titleKey: "connect.featureTimeline" as TranslationKey,
                descKey: "connect.featureTimelineDesc" as TranslationKey,
              },
              {
                icon: GitBranch,
                titleKey: "connect.featureStages" as TranslationKey,
                descKey: "connect.featureStagesDesc" as TranslationKey,
              },
              {
                icon: FileCode,
                titleKey: "connect.featureTech" as TranslationKey,
                descKey: "connect.featureTechDesc" as TranslationKey,
              },
              {
                icon: Zap,
                titleKey: "connect.featureNarrative" as TranslationKey,
                descKey: "connect.featureNarrativeDesc" as TranslationKey,
              },
            ].map((item, i) => (
              <motion.div
                key={item.titleKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="flex gap-4 rounded-xl bg-surface border border-border/40 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <item.icon size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available tools */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            {t("connect.availableTools")}
          </h2>
          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-3 rounded-xl bg-surface border border-border/40 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <tool.icon size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold font-mono text-foreground">
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
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-violet-500/5 to-fuchsia-500/10 border border-accent/20 p-10">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("connect.ctaTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("connect.ctaDesc")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-[1.03] transition-all duration-200"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t("common.copied") : t("connect.copyCommand")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {t("connect.browseGuides")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
