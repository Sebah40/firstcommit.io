import { createClient } from "@/lib/supabase/client";
import type { Guide } from "@/types";

export async function fetchGuides(sort: string = "trending", search?: string): Promise<Guide[]> {
  const supabase = createClient();

  let query = supabase
    .from("posts")
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      media:post_media(*)
    `)
    .eq("is_hidden", false);

  if (search) {
    query = query.or(`title.ilike.%${search}%,hook_description.ilike.%${search}%`);
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

interface UpdateGuideInput {
  title: string;
  hookDescription: string;
  techs: string[];
  categoryId: string | null;
}

export async function updateGuide(guideId: string, input: UpdateGuideInput): Promise<Guide | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .update({
      title: input.title,
      hook_description: input.hookDescription,
      techs: input.techs,
      category_id: input.categoryId,
    })
    .eq("id", guideId)
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      category:categories!posts_category_id_fkey(*),
      media:post_media(*)
    `)
    .single();

  if (error || !data) {
    console.error("Failed to update guide:", error?.message);
    return null;
  }

  return data as unknown as Guide;
}

export async function deleteGuide(guideId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("posts")
    .update({ is_hidden: true })
    .eq("id", guideId);

  if (error) {
    console.error("Failed to delete guide:", error.message);
    return false;
  }

  return true;
}
