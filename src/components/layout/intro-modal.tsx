"use client";

import { useEffect, useRef, useState } from "react";
import { Linkedin, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const STORAGE_KEY = "firstcommit.introSeen.v1";
const LINKEDIN_URL = "https://www.linkedin.com/in/sebastián-haoys-46526a1a2";

export function IntroModal() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleClose() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && handleClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 shadow-2xl">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <Logo className="h-10 w-10 mb-4" />
          <h2
            id="intro-modal-title"
            className="font-newsreader text-2xl font-semibold text-foreground"
          >
            Welcome to First Commit
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A platform where developers share how their projects were built —
            from first commit to production.
          </p>

          <div className="my-6 h-px w-16 bg-border/60" />

          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Designed and built by
          </p>
          <p className="mt-1 font-newsreader text-lg font-medium text-foreground">
            Sebastián Haoys
          </p>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            Connect on LinkedIn
          </a>

          <button
            onClick={handleClose}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue to the site
          </button>
        </div>
      </div>
    </div>
  );
}
