import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guide } from "@/types";

async function _fetchGuides(
  supabase: SupabaseClient,
  sort: string,
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
    query = query.or(`title.ilike.%${search}%,hook_description.ilike.%${search}%,content.ilike.%${search}%`);
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

export async function fetchGuidesServer(
  supabase: SupabaseClient,
  sort: string = "trending",
  search?: string
): Promise<Guide[]> {
  // Don't cache search queries — they vary too much and should be fast anyway
  if (search) {
    return _fetchGuides(supabase, sort, search);
  }

  const cached = unstable_cache(
    () => _fetchGuides(supabase, sort),
    [`guides-${sort}`],
    { revalidate: 60, tags: ["guides"] }
  );

  return cached();
}
