"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Check } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setDone(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2000);
  }

  if (done) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check size={32} className="text-green-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("auth.passwordUpdated")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">{t("auth.setNewPassword")}</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("auth.setNewPasswordDesc")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder={t("auth.newPassword")}
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
          <div>
            <input
              type="password"
              placeholder={t("auth.confirmPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
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
            {loading ? t("common.saving") : t("auth.updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
