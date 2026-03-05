"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

    router.push("/");
    router.refresh();
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
