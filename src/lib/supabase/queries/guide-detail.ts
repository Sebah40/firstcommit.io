import { createClient } from "@/lib/supabase/client";
import type { GuideDetail, Comment, TimelineChapter } from "@/types";

export async function fetchGuideById(guideId: string): Promise<GuideDetail | null> {
  const supabase = createClient();

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

export async function fetchGuideTitle(guideId: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("title")
    .eq("id", guideId)
    .single();

  if (error || !data) return null;
  return data.title;
}

export async function fetchGuideComments(guideId: string): Promise<Comment[]> {
  const supabase = createClient();

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

export function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function checkLikeStatus(guideId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", guideId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function toggleLike(guideId: string, userId: string, liked: boolean) {
  const supabase = createClient();

  if (liked) {
    await supabase.from("post_likes").delete().eq("post_id", guideId).eq("user_id", userId);
  } else {
    await supabase.from("post_likes").insert({ post_id: guideId, user_id: userId });
  }
}

export async function checkSaveStatus(guideId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("post_saves")
    .select("user_id")
    .eq("post_id", guideId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function toggleSave(guideId: string, userId: string, saved: boolean) {
  const supabase = createClient();

  if (saved) {
    await supabase.from("post_saves").delete().eq("post_id", guideId).eq("user_id", userId);
  } else {
    await supabase.from("post_saves").insert({ post_id: guideId, user_id: userId });
  }
}

export async function checkFollowStatus(userId: string, targetId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .maybeSingle();

  return !!data;
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean) {
  const supabase = createClient();

  if (following) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  } else {
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  }
}

export async function fetchRecommendedGuides(guideId: string, categoryId: string | null): Promise<any[]> {
  const supabase = createClient();

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
  return data as unknown as any[];
}

export async function createComment(
  guideId: string,
  userId: string,
  content: string,
  parentId?: string,
  parentDepth?: number
): Promise<Comment | null> {
  const supabase = createClient();

  const depth = parentId && parentDepth !== undefined ? parentDepth + 1 : 0;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: guideId,
      user_id: userId,
      content,
      parent_id: parentId || null,
      depth,
    })
    .select(`
      *,
      profile:profiles!comments_user_id_fkey(*)
    `)
    .single();

  if (error) return null;
  return data as unknown as Comment;
}

export async function updateComment(commentId: string, content: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId);

  if (error) {
    console.error("Failed to update comment:", error.message);
    return false;
  }

  return true;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: true })
    .eq("id", commentId);

  if (error) {
    console.error("Failed to delete comment:", error.message);
    return false;
  }

  return true;
}

export async function checkCommentLikeStatus(commentId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("comment_likes")
    .select("user_id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function toggleCommentLike(commentId: string, userId: string, liked: boolean) {
  const supabase = createClient();

  if (liked) {
    await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  }
}

// ============================================
// Timeline Features — Annotations, Stars, Chapters
// ============================================

export async function upsertAnnotation(messageId: string, postId: string, content: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("message_annotations")
    .upsert(
      { message_id: messageId, post_id: postId, content },
      { onConflict: "message_id" }
    );

  return !error;
}

export async function deleteAnnotation(messageId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("message_annotations")
    .delete()
    .eq("message_id", messageId);

  return !error;
}

export async function toggleStar(messageId: string, postId: string, isStarred: boolean) {
  const supabase = createClient();

  if (isStarred) {
    await supabase.from("message_stars").delete().eq("message_id", messageId);
  } else {
    await supabase.from("message_stars").insert({ message_id: messageId, post_id: postId });
  }
}

export async function createChapter(
  postId: string,
  title: string,
  startOrder: number,
  endOrder: number
): Promise<TimelineChapter | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("timeline_chapters")
    .insert({ post_id: postId, title, start_order: startOrder, end_order: endOrder })
    .select()
    .single();

  if (error) return null;
  return data as unknown as TimelineChapter;
}

export async function updateChapter(
  chapterId: string,
  updates: { title?: string; start_order?: number; end_order?: number }
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("timeline_chapters")
    .update(updates)
    .eq("id", chapterId);

  return !error;
}

export async function deleteChapter(chapterId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("timeline_chapters")
    .delete()
    .eq("id", chapterId);

  return !error;
}
