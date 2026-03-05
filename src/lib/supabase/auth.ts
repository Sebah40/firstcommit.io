"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Server-action wrappers for all write operations (RLS needs server client)
// ---------------------------------------------------------------------------

export async function deleteGuide(guideId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ is_hidden: true }).eq("id", guideId);
  if (error) { console.error("Failed to delete guide:", error.message); return false; }
  return true;
}

export async function updateGuideAction(guideId: string, input: {
  title: string; hookDescription: string; techs: string[]; categoryId: string | null; instanceUrl?: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: input.title,
      hook_description: input.hookDescription,
      techs: input.techs,
      category_id: input.categoryId,
      instance_url: input.instanceUrl ?? null,
    })
    .eq("id", guideId)
    .select("*,profile:profiles!posts_user_id_fkey(*),category:categories!posts_category_id_fkey(*),media:post_media(*)")
    .single();
  if (error || !data) return null;
  return data;
}

export async function toggleLikeAction(guideId: string, userId: string, liked: boolean) {
  const supabase = await createClient();
  if (liked) {
    await supabase.from("post_likes").delete().eq("post_id", guideId).eq("user_id", userId);
  } else {
    await supabase.from("post_likes").insert({ post_id: guideId, user_id: userId });
  }
}

export async function toggleSaveAction(guideId: string, userId: string, saved: boolean) {
  const supabase = await createClient();
  if (saved) {
    await supabase.from("post_saves").delete().eq("post_id", guideId).eq("user_id", userId);
  } else {
    await supabase.from("post_saves").insert({ post_id: guideId, user_id: userId });
  }
}

export async function toggleFollowAction(followerId: string, followingId: string, following: boolean) {
  const supabase = await createClient();
  if (following) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  } else {
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  }
}

export async function createCommentAction(
  guideId: string, userId: string, content: string, parentId?: string, parentDepth?: number
) {
  const supabase = await createClient();
  const depth = parentId && parentDepth !== undefined ? parentDepth + 1 : 0;
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: guideId, user_id: userId, content, parent_id: parentId || null, depth })
    .select("*,profile:profiles!comments_user_id_fkey(*)")
    .single();
  if (error) return null;
  return data;
}

export async function updateCommentAction(commentId: string, content: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").update({ content }).eq("id", commentId);
  if (error) { console.error("Failed to update comment:", error.message); return false; }
  return true;
}

export async function deleteCommentAction(commentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").update({ is_hidden: true }).eq("id", commentId);
  if (error) { console.error("Failed to delete comment:", error.message); return false; }
  return true;
}

export async function toggleCommentLikeAction(commentId: string, userId: string, liked: boolean) {
  const supabase = await createClient();
  if (liked) {
    await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  }
}
