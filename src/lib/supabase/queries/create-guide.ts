import { createClient } from "@/lib/supabase/client";
import type { GuideBuilderState } from "@/hooks/use-guide-builder";

interface PublishInput {
  state: GuideBuilderState;
  userId: string;
}

export async function publishGuide({ state, userId }: PublishInput): Promise<string | null> {
  const supabase = createClient();

  // 1. Insert post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      title: state.title.trim(),
      description: state.description.trim(),
      difficulty: state.difficulty,
      time_estimate_minutes: state.timeEstimate,
      is_vibe_coded: state.isVibeCoded,
      guide_type: state.guideType,
      prerequisites: state.prerequisites,
      what_youll_build: state.whatYoullBuild.trim() || null,
      original_json: state.originalJson,
      techs: state.techs,
      category_id: state.categoryId,
    })
    .select("id")
    .single();

  if (postError || !post) {
    console.error("Failed to create post:", postError?.message);
    return null;
  }

  const postId = post.id;

  // 2. Upload media
  if (state.mediaFiles.length > 0) {
    const mediaRows = [];

    for (let i = 0; i < state.mediaFiles.length; i++) {
      const media = state.mediaFiles[i];
      const ext = media.file.name.split(".").pop();
      const path = `${userId}/${postId}/${i}.${ext}`;

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
        post_id: postId,
        url: urlData.publicUrl,
        type: media.type,
        order: i,
      });
    }

    if (mediaRows.length > 0) {
      await supabase.from("post_media").insert(mediaRows);
    }
  }

  // 3. Insert guide_blocks (batched)
  const clientIdToRealBlockId = new Map<string, string>();

  if (state.blocks.length > 0) {
    const blockRows = state.blocks.map((b) => ({
      post_id: postId,
      role: b.role,
      content: b.content,
      tool_action: b.toolAction,
      file_path: b.filePath,
      original_order: b.originalOrder,
      auto_category: b.autoCategory,
      files_touched: b.filesTouched,
    }));

    for (let i = 0; i < blockRows.length; i += 500) {
      const batch = blockRows.slice(i, i + 500);
      const batchBlocks = state.blocks.slice(i, i + 500);

      const { data: inserted, error: blockError } = await supabase
        .from("guide_blocks")
        .insert(batch)
        .select("id");

      if (blockError) {
        console.error("guide_blocks insert error:", blockError.message);
        continue;
      }

      if (inserted) {
        for (let j = 0; j < inserted.length; j++) {
          clientIdToRealBlockId.set(batchBlocks[j].clientId, inserted[j].id);
        }
      }
    }
  }

  // 4. Insert guide_steps (batched)
  const clientIdToRealStepId = new Map<string, string>();

  if (state.steps.length > 0) {
    const stepRows = state.steps.map((s) => ({
      post_id: postId,
      title: s.title.trim() || `Step ${s.order + 1}`,
      description: s.description.trim() || null,
      author_annotation: s.authorAnnotation.trim() || null,
      suggested_prompt: s.suggestedPrompt.trim() || null,
      checkpoint_description: s.checkpointDescription.trim() || null,
      order: s.order,
    }));

    const { data: insertedSteps, error: stepError } = await supabase
      .from("guide_steps")
      .insert(stepRows)
      .select("id");

    if (stepError) {
      console.error("guide_steps insert error:", stepError.message);
    } else if (insertedSteps) {
      for (let i = 0; i < insertedSteps.length; i++) {
        clientIdToRealStepId.set(state.steps[i].clientId, insertedSteps[i].id);
      }
    }
  }

  // 5. Insert step_blocks (batched)
  const stepBlockRows: {
    step_id: string;
    block_id: string;
    position: number;
    display_mode: string;
    author_note: string | null;
  }[] = [];

  for (const step of state.steps) {
    const realStepId = clientIdToRealStepId.get(step.clientId);
    if (!realStepId) continue;

    for (const assignment of step.blockAssignments) {
      const realBlockId = clientIdToRealBlockId.get(assignment.blockClientId);
      if (!realBlockId) continue;

      stepBlockRows.push({
        step_id: realStepId,
        block_id: realBlockId,
        position: assignment.position,
        display_mode: assignment.displayMode,
        author_note: assignment.authorNote.trim() || null,
      });
    }
  }

  if (stepBlockRows.length > 0) {
    for (let i = 0; i < stepBlockRows.length; i += 500) {
      const batch = stepBlockRows.slice(i, i + 500);
      const { error: sbError } = await supabase
        .from("step_blocks")
        .insert(batch);

      if (sbError) {
        console.error("step_blocks insert error:", sbError.message);
      }
    }
  }

  // 6. Insert chat_messages (backward compat for timeline view)
  if (state.blocks.length > 0) {
    const chatRows = state.blocks.map((b, i) => ({
      post_id: postId,
      role: b.role,
      content: b.content,
      tool_action: b.toolAction,
      file_path: b.filePath,
      order: i,
    }));

    for (let i = 0; i < chatRows.length; i += 500) {
      const batch = chatRows.slice(i, i + 500);
      const { error: chatError } = await supabase
        .from("chat_messages")
        .insert(batch);

      if (chatError) {
        console.error("chat_messages insert error:", chatError.message);
      }
    }
  }

  return postId;
}
