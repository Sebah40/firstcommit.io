import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);
  const minQuality = searchParams.get("min_quality") ?? "any";

  if (!q?.trim()) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const searchTerm = `%${q.trim()}%`;

  let query = supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(username)
    `)
    .eq("is_hidden", false)
    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);

  // Apply minimum quality thresholds
  if (minQuality === "medium") {
    query = query.or("likes_count.gte.2,saves_count.gte.1");
  } else if (minQuality === "high") {
    query = query.gte("likes_count", 5).gte("comments_count", 1);
  }

  query = query.order("trending_score", { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = request.headers.get("host") ?? "localhost:3000";
  const protocol = baseUrl.includes("localhost") ? "http" : "https";

  const results = (data ?? []).map((post: any) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    techs: post.techs,
    author: post.profile?.username ?? "unknown",
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    message_count: post.message_count ?? 0,
    quality_score:
      ((post.likes_count ?? 0) * 3) +
      ((post.comments_count ?? 0) * 2) +
      ((post.saves_count ?? 0) * 2) +
      ((post.completions_count ?? 0) * 5) +
      ((post.avg_rating ?? 0) * 10),
    url: `${protocol}://${baseUrl}/guide/${post.id}`,
  }));

  results.sort((a: any, b: any) => b.quality_score - a.quality_score);

  return NextResponse.json({ results });
}
