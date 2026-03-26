import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guide } from "@/types";
import { translateToEnglish } from "@/lib/translate";

// Lightweight client for public reads — no cookies, fully cacheable
function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Select only the columns the feed/grid actually needs (skip full content body)
const FEED_COLUMNS = `
  id, title, hook_description, techs, likes_count, saves_count, comments_count,
  trending_score, is_hidden, created_at, updated_at, difficulty, guide_type,
  message_count, files_changed, highlight_snippet, instance_url, user_id,
  profile:profiles!posts_user_id_fkey(username, display_name, avatar_url),
  media:post_media(id, url, type, "order"),
  stages:post_stages(id)
`;

/** Attach stage_count to each guide from the joined stages array */
function withStageCounts(guides: any[]): Guide[] {
  return guides.map((g) => {
    const stage_count = Array.isArray(g.stages) ? g.stages.length : 0;
    const { stages: _stages, ...rest } = g;
    return { ...rest, stage_count } as Guide;
  });
}

async function _fetchGuides(
  sort: string,
  search?: string
): Promise<Guide[]> {
  const supabase = getReadClient();
  let query = supabase
    .from("posts")
    .select(FEED_COLUMNS)
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

  return withStageCounts(data as any[]);
}

const cachedFetchGuides = unstable_cache(
  (sort: string) => _fetchGuides(sort),
  ["guides"],
  { revalidate: 60, tags: ["guides"] }
);

export async function fetchGuidesServer(
  supabase: SupabaseClient,
  sort: string = "trending",
  search?: string
): Promise<Guide[]> {
  if (search) {
    const englishSearch = await translateToEnglish(search);
    if (englishSearch.toLowerCase() !== search.toLowerCase()) {
      const [origResults, transResults] = await Promise.all([
        _fetchGuides(sort, search),
        _fetchGuides(sort, englishSearch),
      ]);
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
    return _fetchGuides(sort, search);
  }

  return cachedFetchGuides(sort);
}
