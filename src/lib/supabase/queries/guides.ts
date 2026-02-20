import { createClient } from "@/lib/supabase/client";
import type { Guide } from "@/types";
import type { MediaFile } from "@/components/create/media-upload";
import type { ParsedMessage } from "@/lib/parser/claude-code";

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

interface CreateGuideInput {
  title: string;
  description: string;
  techs: string[];
  categoryId: string | null;
  mediaFiles: MediaFile[];
  chatMessages: ParsedMessage[];
}

export async function createGuide(input: CreateGuideInput & { userId: string }): Promise<string | null> {
  const supabase = createClient();
  const userId = input.userId;

  // 1. Insert post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      techs: input.techs,
      category_id: input.categoryId,
    })
    .select("id")
    .single();

  if (postError || !post) {
    console.error("Failed to create guide:", postError?.message);
    return null;
  }

  // 2. Upload media files
  if (input.mediaFiles.length > 0) {
    const mediaRows = [];

    for (let i = 0; i < input.mediaFiles.length; i++) {
      const media = input.mediaFiles[i];
      const ext = media.file.name.split(".").pop();
      const path = `${userId}/${post.id}/${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, media.file);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("post-media")
        .getPublicUrl(path);

      mediaRows.push({
        post_id: post.id,
        url: urlData.publicUrl,
        type: media.type,
        order: i,
      });
    }

    if (mediaRows.length > 0) {
      await supabase.from("post_media").insert(mediaRows);
    }
  }

  // 3. Save chat messages
  if (input.chatMessages.length > 0) {
    const chatRows = input.chatMessages.map((msg, i) => ({
      post_id: post.id,
      role: msg.role,
      content: msg.content,
      tool_action: msg.toolAction,
      file_path: msg.filePath,
      order: i,
    }));

    // Insert in batches of 500 (Supabase limit)
    for (let i = 0; i < chatRows.length; i += 500) {
      const batch = chatRows.slice(i, i + 500);
      const { error: chatError } = await supabase
        .from("chat_messages")
        .insert(batch);

      if (chatError) {
        console.error("Chat insert error:", chatError.message);
      }
    }
  }

  return post.id;
}

interface UpdateGuideInput {
  title: string;
  description: string;
  techs: string[];
  categoryId: string | null;
}

export async function updateGuide(guideId: string, input: UpdateGuideInput): Promise<Guide | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .update({
      title: input.title,
      description: input.description,
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
