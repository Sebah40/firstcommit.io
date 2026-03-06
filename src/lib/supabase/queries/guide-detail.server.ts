import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuideDetail, Comment, Guide } from "@/types";

export async function fetchGuideByIdServer(
  supabase: SupabaseClient,
  guideId: string
): Promise<GuideDetail | null> {
  const cached = unstable_cache(
    async () => {
      const { data, error } = (await supabase
        .from("posts")
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(*),
          category:categories!posts_category_id_fkey(*),
          media:post_media(*),
          stages:post_stages(*)
        `)
        .eq("id", guideId)
        .eq("is_hidden", false)
        .single()) as { data: any; error: any };

      if (error || !data) return null;

      if (data.media) {
        data.media.sort((a: any, b: any) => a.order - b.order);
      }
      if (data.stages) {
        data.stages.sort((a: any, b: any) => a.stage_order - b.stage_order);
      }

      return data as GuideDetail;
    },
    [`guide-${guideId}`],
    { revalidate: 120, tags: ["guides", `guide-${guideId}`] }
  );

  return cached();
}

export async function fetchGuideCommentsServer(
  supabase: SupabaseClient,
  guideId: string
): Promise<Comment[]> {
  // Comments change frequently — short cache
  const cached = unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profile:profiles!comments_user_id_fkey(*)
        `)
        .eq("post_id", guideId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });

      if (error) return [];
      return data as unknown as Comment[];
    },
    [`comments-${guideId}`],
    { revalidate: 30, tags: [`comments-${guideId}`] }
  );

  return cached();
}

export async function fetchRecommendedGuidesServer(
  supabase: SupabaseClient,
  guideId: string,
  categoryId: string | null
): Promise<Guide[]> {
  const cached = unstable_cache(
    async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(*),
          media:post_media(*)
        `)
        .eq("is_hidden", false)
        .neq("id", guideId)
        .order("trending_score", { ascending: false })
        .limit(5);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) return [];
      return data as unknown as Guide[];
    },
    [`recommended-${guideId}-${categoryId ?? "all"}`],
    { revalidate: 120, tags: ["guides"] }
  );

  return cached();
}
