"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Mail, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username.length < 3) {
      setError(t("auth.usernameMinLength"));
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(t("auth.usernameChars"));
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setShowConfirm(true);
  }

  if (showConfirm) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Mail size={24} className="text-white" />
            </div>
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <Sparkles size={16} className="text-accent" />
          </div>
          <p className="mb-2 text-sm text-muted-foreground">
            We sent a confirmation link to
          </p>
          <p className="mb-6 text-sm font-medium text-foreground">{email}</p>
          <div className="rounded-xl bg-surface border border-border/40 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the link in your email to activate your account. Once confirmed, you can connect Claude Code and start publishing your build stories.
            </p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Didn&apos;t get it? Check your spam folder or{" "}
            <button
              onClick={() => setShowConfirm(false)}
              className="text-accent hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">{t("auth.createAccount")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("auth.joinPathway")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={t("auth.username")}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              className={cn(
                "w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-accent/30 transition-shadow"
              )}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder={t("common.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                "w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-accent/30 transition-shadow"
              )}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={t("auth.passwordMin")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={cn(
                "w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-accent/30 transition-shadow"
              )}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50"
            )}
          >
            {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
