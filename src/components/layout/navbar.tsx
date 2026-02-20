"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, Plus, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const { user, profile, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/");
    }
  }

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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-surface">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="text-lg font-semibold text-foreground">Pathway</span>
      </Link>

      {/* Center: Search */}
      <form onSubmit={handleSearch} className="hidden max-w-md flex-1 px-8 md:block">
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 focus-within:ring-2 focus-within:ring-accent/30 transition-shadow">
          <Search size={16} className="text-muted-foreground" />
          <input
            name="search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search guides..."
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </form>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {user ? (
          <>
            <Link
              href="/create"
              className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create</span>
            </Link>

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
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
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
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
