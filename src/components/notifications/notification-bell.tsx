"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime, guideDetailPath } from "@/lib/utils";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
} from "@/lib/supabase/queries/notifications";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";

interface NotificationBellProps {
  userId: string;
}

const typeConfig: Record<string, { icon: typeof Heart; color: string; label: string }> = {
  like: { icon: Heart, color: "text-red-500", label: "liked your guide" },
  comment: { icon: MessageCircle, color: "text-blue-500", label: "commented on your guide" },
  reply: { icon: Reply, color: "text-violet-500", label: "replied to your comment" },
  follow: { icon: UserPlus, color: "text-emerald-500", label: "started following you" },
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount(userId).then(setUnreadCount);
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((c) => c + 1);
          // If dropdown is open, refresh the list
          if (loaded) {
            fetchNotifications(userId).then(setNotifications);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loaded]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = useCallback(async () => {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen) {
      const data = await fetchNotifications(userId);
      setNotifications(data);
      setLoaded(true);

      // Mark all as read
      if (unreadCount > 0) {
        await markAllNotificationsRead(userId);
        setUnreadCount(0);
      }
    }
  }, [open, userId, unreadCount]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-[60] rounded-xl bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
          <div className="border-b border-border/40 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell size={24} className="mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const config = typeConfig[n.type] || typeConfig.like;
  const Icon = config.icon;

  const href =
    n.type === "follow"
      ? `/profile/${n.actor?.username}`
      : n.post
        ? guideDetailPath(n.post.id, n.post.title)
        : "#";

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
        !n.read ? "bg-accent/[0.03]" : ""
      }`}
    >
      <div className="relative shrink-0">
        <Avatar
          userId={n.actor_id}
          username={n.actor?.username ?? "?"}
          avatarUrl={n.actor?.avatar_url}
          size="sm"
        />
        <div className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface ${config.color}`}>
          <Icon size={10} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{n.actor?.display_name || n.actor?.username}</span>{" "}
          <span className="text-muted-foreground">{config.label}</span>
        </p>
        {n.post && n.type !== "follow" && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.post.title}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {formatRelativeTime(n.created_at)}
        </p>
      </div>

      {!n.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
      )}
    </Link>
  );
}
