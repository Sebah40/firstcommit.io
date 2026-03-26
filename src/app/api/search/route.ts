import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { translateToEnglish } from "@/lib/translate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

async function searchPosts(supabase: any, searchTerm: string, minQuality: string, limit: number) {
  let query = supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(username)
    `)
    .eq("is_hidden", false)
    .or(`title.ilike.${searchTerm},hook_description.ilike.${searchTerm},content.ilike.${searchTerm}`);

  if (minQuality === "medium") {
    query = query.or("likes_count.gte.2,saves_count.gte.1");
  } else if (minQuality === "high") {
    query = query.gte("likes_count", 5).gte("comments_count", 1);
  }

  query = query.order("trending_score", { ascending: false }).limit(limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit_result = rateLimit(`search:${ip}`, { max: 30, windowMs: 60_000 });
  if (!limit_result.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit_result.retryAfterMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);
  const minQuality = searchParams.get("min_quality") ?? "any";

  if (!q?.trim()) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const trimmed = q.trim();
  const searchTerm = `%${trimmed}%`;

  // Translate query to English in parallel with original search
  const englishPromise = translateToEnglish(trimmed);
  const originalPromise = searchPosts(supabase, searchTerm, minQuality, limit);

  const [englishQuery, originalResult] = await Promise.all([englishPromise, originalPromise]);

  if (originalResult.error) {
    return NextResponse.json({ error: originalResult.error.message }, { status: 500 });
  }

  let allPosts = originalResult.data;

  // If the translated query differs, search with that too and merge
  if (englishQuery.toLowerCase() !== trimmed.toLowerCase()) {
    const translatedTerm = `%${englishQuery}%`;
    const { data: translatedData } = await searchPosts(supabase, translatedTerm, minQuality, limit);
    const seen = new Set(allPosts.map((p: any) => p.id));
    for (const post of translatedData) {
      if (!seen.has(post.id)) {
        allPosts.push(post);
      }
    }
  }

  const baseUrl = request.headers.get("host") ?? "localhost:3000";
  const protocol = baseUrl.includes("localhost") ? "http" : "https";

  const results = allPosts.map((post: any) => ({
    id: post.id,
    title: post.title,
    description: post.hook_description,
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

  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
