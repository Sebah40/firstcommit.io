"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { GuideBuilder } from "@/components/create/guide-builder";

export default function CreatePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-xl font-semibold text-foreground">Sign in to create</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          You need an account to create guides
        </p>
        <Link
          href="/login"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <GuideBuilder userId={user.id} />;
}
