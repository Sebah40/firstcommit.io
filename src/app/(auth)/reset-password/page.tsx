"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Mail size={24} className="text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("auth.checkEmail")}</h1>
          <p className="mb-2 text-sm text-muted-foreground">
            {t("auth.resetEmailSent")}
          </p>
          <p className="mb-6 text-sm font-medium text-foreground">{email}</p>
          <div className="rounded-xl bg-surface border border-border/40 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("auth.resetEmailDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">{t("auth.resetPassword")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("auth.resetPasswordDesc")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground",
              "hover:opacity-90 transition-opacity disabled:opacity-50"
            )}
          >
            {loading ? t("auth.sending") : t("auth.sendResetLink")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.rememberPassword")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
