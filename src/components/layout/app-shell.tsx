"use client";

import { Suspense } from "react";
import { Navbar } from "./navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-0">
      <Suspense>
        <Navbar />
      </Suspense>
      <main className="pt-14 print:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:px-0 print:py-0 print:max-w-none">{children}</div>
      </main>
    </div>
  );
}
