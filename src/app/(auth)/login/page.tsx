"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();
  const { t } = useTranslation();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setMagicLinkSent(true);
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Mail size={24} className="text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("auth.checkEmail")}</h1>
          <p className="mb-2 text-sm text-muted-foreground">{t("auth.magicLinkSent")}</p>
          <p className="mb-6 text-sm font-medium text-foreground">{email}</p>
          <div className="rounded-xl bg-surface border border-border/40 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("auth.magicLinkDesc")}
            </p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {t("auth.didntGetIt")}{" "}
            <button onClick={() => setMagicLinkSent(false)} className="text-accent hover:underline">
              {t("auth.tryAgain")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("auth.signInToAccount")}
        </p>

        {/* Toggle */}
        <div className="mb-6 flex rounded-lg bg-muted p-1">
          <button
            onClick={() => { setMode("password"); setError(""); }}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              mode === "password" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t("auth.password")}
          </button>
          <button
            onClick={() => { setMode("magic"); setError(""); }}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              mode === "magic" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t("auth.magicLink")}
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
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
            <input
              type="password"
              placeholder={t("common.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                "w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none",
                "text-foreground placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-accent/30 transition-shadow"
              )}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground",
                "hover:opacity-90 transition-opacity disabled:opacity-50"
              )}
            >
              {loading ? t("auth.signingIn") : t("common.signIn")}
            </button>

            <p className="text-center text-sm">
              <Link href="/reset-password" className="text-muted-foreground hover:text-accent transition-colors">
                {t("auth.forgotPassword")}
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
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

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground",
                "hover:opacity-90 transition-opacity disabled:opacity-50"
              )}
            >
              {loading ? t("auth.sending") : t("auth.sendMagicLink")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-accent hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
