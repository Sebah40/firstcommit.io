"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-surface/50 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <Logo className="h-6 w-6" />
              <span className="text-base font-semibold text-foreground">First Commit</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              See how it was built. Developers share step-by-step build stories
              from first commit to production.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm">
            <div>
              <h4 className="mb-3 font-semibold text-foreground">Platform</h4>
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground transition-colors">Browse</Link></li>
                <li><Link href="/connect" className="hover:text-foreground transition-colors">Connect</Link></li>
                <li><Link href="/feed.xml" className="hover:text-foreground transition-colors">RSS Feed</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-foreground">Resources</h4>
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li><Link href="/connect" className="hover:text-foreground transition-colors">How it works</Link></li>
                <li><Link href="/connect#tools" className="hover:text-foreground transition-colors">MCP Tools</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/40 pt-6 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} First Commit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
