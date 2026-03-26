import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Service role client for DB writes (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Google Translate batch (max 50 texts)
async function translateBatch(
  texts: string[],
  target: string
): Promise<string[]> {
  const batch = texts.slice(0, 50);
  const params = new URLSearchParams();
  params.set("client", "gtx");
  params.set("sl", "auto");
  params.set("tl", target);
  params.set("dt", "t");
  for (const text of batch) {
    params.append("q", text);
  }

  const res = await fetch(
    `https://translate.googleapis.com/translate_a/t?${params.toString()}`,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (!res.ok) throw new Error("Translation service error");

  const data = await res.json();

  if (batch.length === 1) {
    return [Array.isArray(data[0]) ? data[0][0] : data[0]];
  }
  return data.map((item: string | string[]) =>
    Array.isArray(item) ? item[0] : item
  );
}

// Translate many texts (splits into batches of 50)
async function translateAll(
  texts: string[],
  target: string
): Promise<string[]> {
  if (texts.length <= 50) return translateBatch(texts, target);

  const results: string[] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const chunk = texts.slice(i, i + 50);
    const translated = await translateBatch(chunk, target);
    results.push(...translated);
  }
  return results;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit_result = rateLimit(`translate:${ip}`, { max: 20, windowMs: 60_000 });
  if (!limit_result.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit_result.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();

  // ── Mode 1: Cached post translation (postId + locale) ──
  if (body.postId && body.locale) {
    return handlePostTranslation(body.postId, body.locale);
  }

  // ── Mode 2: Ad-hoc text translation (texts + target) ──
  const { texts, target } = body;
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    typeof target !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const translated = await translateBatch(texts, target);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

// ── Cached post translation ──

async function handlePostTranslation(postId: string, locale: string) {
  if (locale === "en") {
    return NextResponse.json({ error: "English is the source language" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch source post
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, title, hook_description, content, updated_at")
    .eq("id", postId)
    .eq("is_hidden", false)
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check cache
  const { data: cached } = await supabase
    .from("post_translations")
    .select("title, hook_description, content, stages_json, source_updated_at")
    .eq("post_id", postId)
    .eq("locale", locale)
    .single();

  if (cached && cached.source_updated_at >= post.updated_at) {
    return NextResponse.json({
      title: cached.title,
      hook_description: cached.hook_description,
      content: cached.content,
      stages: cached.stages_json,
      cached: true,
    });
  }

  // Fetch stages
  const { data: stages } = await supabase
    .from("post_stages")
    .select("stage_order, stage_name, summary, key_decisions, problems_hit")
    .eq("post_id", postId)
    .order("stage_order", { ascending: true });

  // Collect all texts to translate
  const texts: string[] = [
    post.title || "",
    post.hook_description || "",
  ];

  const stageList = stages ?? [];
  for (const stage of stageList) {
    texts.push(stage.stage_name || "");
    texts.push(stage.summary || "");
    for (const d of (stage.key_decisions as string[]) ?? []) texts.push(d);
    for (const p of (stage.problems_hit as string[]) ?? []) texts.push(p);
  }

  try {
    const translated = await translateAll(texts, locale);

    // Reconstruct
    let idx = 0;
    const trTitle = translated[idx++];
    const trHook = translated[idx++];

    const trStages = stageList.map((stage) => {
      const stageName = translated[idx++];
      const summary = translated[idx++];
      const keyDecisions = ((stage.key_decisions as string[]) ?? []).map(
        () => translated[idx++]
      );
      const problemsHit = ((stage.problems_hit as string[]) ?? []).map(
        () => translated[idx++]
      );
      return {
        stage_order: stage.stage_order,
        stage_name: stageName,
        summary,
        key_decisions: keyDecisions,
        problems_hit: problemsHit,
      };
    });

    // Upsert into cache (service role bypasses RLS)
    await supabase
      .from("post_translations")
      .upsert(
        {
          post_id: postId,
          locale,
          title: trTitle,
          hook_description: trHook,
          content: null, // content body not translated yet (future)
          stages_json: trStages,
          source_updated_at: post.updated_at,
        },
        { onConflict: "post_id,locale" }
      );

    return NextResponse.json({
      title: trTitle,
      hook_description: trHook,
      content: null,
      stages: trStages,
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
