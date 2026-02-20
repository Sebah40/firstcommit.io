import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuideDetail, Comment, Guide } from "@/types";

export async function fetchGuideByIdServer(
  supabase: SupabaseClient,
  guideId: string
): Promise<GuideDetail | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      category:categories!posts_category_id_fkey(*),
      media:post_media(*),
      chat_messages(*, annotation:message_annotations(*), star:message_stars(*)),
      timeline_chapters(*)
    `)
    .eq("id", guideId)
    .eq("is_hidden", false)
    .single();

  if (error || !data) return null;

  // Sort media and chat_messages by order
  if (data.media) {
    (data.media as any[]).sort((a: any, b: any) => a.order - b.order);
  }
  if (data.chat_messages) {
    (data.chat_messages as any[]).sort((a: any, b: any) => a.order - b.order);
    // Map joined annotation (array→single) and star (presence→boolean)
    for (const msg of data.chat_messages as any[]) {
      const annArr = msg.annotation;
      msg.annotation = Array.isArray(annArr) && annArr.length > 0 ? annArr[0] : undefined;
      const starArr = msg.star;
      msg.is_starred = Array.isArray(starArr) ? starArr.length > 0 : !!starArr;
      delete msg.star;
    }
  }
  if (data.timeline_chapters) {
    (data.timeline_chapters as any[]).sort((a: any, b: any) => a.start_order - b.start_order);
  }

  return data as unknown as GuideDetail;
}

export async function fetchGuideCommentsServer(
  supabase: SupabaseClient,
  guideId: string
): Promise<Comment[]> {
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
}

export async function fetchRecommendedGuidesServer(
  supabase: SupabaseClient,
  guideId: string,
  categoryId: string | null
): Promise<Guide[]> {
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
}
