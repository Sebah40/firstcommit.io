"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, Terminal, Languages, UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { LOCALES } from "@/lib/i18n";
import { InviteModal } from "@/components/invite/invite-modal";
import { SearchBar } from "@/components/layout/search-bar";

export function Navbar() {
  const { user, profile, loading } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 glass border-b border-border/40">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-8 w-8" />
        <span className="text-lg font-semibold text-foreground hidden sm:inline">First Commit</span>
      </Link>

      {/* Center: Search */}
      <SearchBar />

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLangOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          title={t("nav.language")}
        >
          <Languages size={18} />
        </button>
        <ThemeToggle />

        {/* CTA — always visible */}
        <Link
          href="/connect"
          className="group relative flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-[1.03] transition-all duration-200"
        >
          <Terminal size={14} />
          <span className="hidden sm:inline">{t("nav.connect")}</span>
        </Link>

        {user ? (
          <>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              title={t("invite.title")}
            >
              <UserPlus size={18} />
            </button>

            {/* Avatar menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <Avatar
                  userId={user.id}
                  username={profile?.username ?? user.email?.charAt(0) ?? "U"}
                  avatarUrl={profile?.avatar_url}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 z-[60] rounded-xl bg-surface p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.display_name ?? profile?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{profile?.username}
                    </p>
                  </div>
                  <div className="my-1 border-t border-muted" />
                  <Link
                    href={`/profile/${profile?.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <User size={15} />
                    {t("nav.profile")}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <LogOut size={15} />
                    {t("nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            {t("common.signIn")}
          </Link>
        )}
      </div>

      {/* Invite modal */}
      {user && profile && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          username={profile.username}
        />
      )}

      {/* Language modal */}
      {langOpen && (
        <div
          ref={langRef}
          onClick={(e) => e.target === langRef.current && setLangOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-xs rounded-2xl bg-surface p-5">
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t("nav.language")}</h3>
            <div className="flex flex-col gap-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => {
                    setLocale(loc.value);
                    setLangOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    locale === loc.value
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  {loc.label}
                  {locale === loc.value && (
                    <span className="ml-auto text-accent">&#10003;</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
