import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Guide } from "@/types";

export async function fetchProfileByUsernameServer(
  supabase: SupabaseClient,
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function fetchUserGuidesServer(
  supabase: SupabaseClient,
  userId: string
): Promise<Guide[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      media:post_media(*)
    `)
    .eq("user_id", userId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as Guide[];
}
