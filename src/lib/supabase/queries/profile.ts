import { createClient } from "@/lib/supabase/client";
import type { Profile, Guide, Comment } from "@/types";

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function fetchUserGuides(userId: string): Promise<Guide[]> {
  const supabase = createClient();

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

export async function fetchUserComments(userId: string): Promise<Comment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profile:profiles!comments_user_id_fkey(*),
      post:posts!comments_post_id_fkey(id, title)
    `)
    .eq("user_id", userId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as Comment[];
}

export async function fetchUserLikedGuides(userId: string): Promise<Guide[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_likes")
    .select(`
      post:posts!post_likes_post_id_fkey(
        *,
        profile:profiles!posts_user_id_fkey(*),
        media:post_media(*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: any) => row.post).filter(Boolean) as Guide[];
}

export async function fetchUserSavedGuides(userId: string): Promise<Guide[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_saves")
    .select(`
      post:posts!post_saves_post_id_fkey(
        *,
        profile:profiles!posts_user_id_fkey(*),
        media:post_media(*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: any) => row.post).filter(Boolean) as Guide[];
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "bio" | "show_likes" | "show_saves" | "github_url" | "linkedin_url" | "avatar_url" | "cv_url">>
): Promise<Profile | null> {
  const supabase = createClient();

  // Strip undefined values — Supabase rejects them
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) clean[key] = value;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(clean)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update profile:", error.message);
    return null;
  }
  return data as Profile;
}
