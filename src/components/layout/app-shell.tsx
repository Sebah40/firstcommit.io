"use client";

import { Suspense } from "react";
import { Navbar } from "./navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <Navbar />
      </Suspense>
      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
