import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guide } from "@/types";
import { translateToEnglish } from "@/lib/translate";

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
  if (search) {
    // Translate the query to English so it matches English content in the DB
    const englishSearch = await translateToEnglish(search);
    // Search with both original and translated terms for best coverage
    if (englishSearch.toLowerCase() !== search.toLowerCase()) {
      const [origResults, transResults] = await Promise.all([
        _fetchGuides(supabase, sort, search),
        _fetchGuides(supabase, sort, englishSearch),
      ]);
      // Merge and deduplicate
      const seen = new Set<string>();
      const merged: Guide[] = [];
      for (const g of [...transResults, ...origResults]) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          merged.push(g);
        }
      }
      return merged;
    }
    return _fetchGuides(supabase, sort, search);
  }

  const cached = unstable_cache(
    () => _fetchGuides(supabase, sort),
    [`guides-${sort}`],
    { revalidate: 60, tags: ["guides"] }
  );

  return cached();
}
