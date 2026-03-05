"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Terminal, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function AuthorizePage() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";
  const state = searchParams.get("state");
  const responseType = searchParams.get("response_type");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const isValid = clientId && redirectUri && codeChallenge && responseType === "code";

  useEffect(() => {
    if (!isValid) return;
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAlreadyLoggedIn(true);
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUsername(data.username);
          });
      }
    });
  }, [isValid]);

  if (!isValid) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h1 className="mb-2 text-xl font-bold text-foreground">{t("auth.invalidRequest")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.invalidRequestDesc")}
          </p>
        </div>
      </div>
    );
  }

  async function createCodeAndRedirect(accessToken: string, refreshToken: string) {
    try {
      const res = await fetch("/api/mcp/oauth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create authorization code");
        return;
      }

      const { code } = await res.json();
      const url = new URL(redirectUri!);
      url.searchParams.set("code", code);
      if (state) url.searchParams.set("state", state);

      setDone(true);
      window.location.href = url.toString();
    } catch {
      setError(t("auth.somethingWrong"));
    }
  }

  async function handleAuthorize() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      await createCodeAndRedirect(session.access_token, session.refresh_token!);
    } else {
      setError(t("auth.sessionNotFound"));
    }
    setLoading(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? "Sign in failed");
      setLoading(false);
      return;
    }

    await createCodeAndRedirect(data.session.access_token, data.session.refresh_token!);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check size={32} className="text-green-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">{t("auth.connected")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.connectedDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Terminal size={24} className="text-accent" />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            {t("auth.connectClaudeCode")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.authorizeDesc")}
          </p>
        </div>

        {alreadyLoggedIn ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted px-4 py-3 text-center">
              <p className="text-sm text-foreground">
                {t("auth.signedInAs")} <span className="font-medium">{username || "..."}</span>
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleAuthorize}
              disabled={loading}
              className={cn(
                "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground",
                "hover:opacity-90 transition-opacity disabled:opacity-50"
              )}
            >
              {loading ? t("auth.connecting") : t("auth.authorizeClaudeCode")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
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
              {loading ? t("auth.signingIn") : t("auth.signInAuthorize")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
