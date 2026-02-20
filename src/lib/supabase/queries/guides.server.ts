import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guide } from "@/types";

export async function fetchGuidesServer(
  supabase: SupabaseClient,
  sort: string = "trending",
  search?: string
): Promise<Guide[]> {
  let query = supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      media:post_media(*)
    `)
    .eq("is_hidden", false);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  switch (sort) {
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "popular":
      query = query.order("likes_count", { ascending: false });
      break;
    case "trending":
    default:
      query = query.order("trending_score", { ascending: false });
      break;
  }

  const { data, error } = await query.limit(24);

  if (error) {
    console.error("Failed to fetch guides:", error.message);
    return [];
  }

  return data as unknown as Guide[];
}
