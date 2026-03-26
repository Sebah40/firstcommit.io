import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
      post:posts!notifications_post_id_fkey(id, title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return [];
  return data as unknown as Notification[];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}
