import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// ── Types ────────────────────────────────────────────────────

interface RawStage {
  stage_name: string;
  summary: string;
  key_decisions: string[];
  problems_hit: string[];
}

export interface CompiledStage {
  stage_name: string;
  summary: string;
  key_decisions: string[];
  problems_hit: string[];
  duration_messages: number;
}

export interface CompiledTimeline {
  hook: string;
  stages: CompiledStage[];
}

// ── Constants ────────────────────────────────────────────────

const CHUNK_SIZE = 100;
const MODEL = "gpt-4o-mini" as const;

const MAP_SYSTEM = `You are a technical project analyst. You will receive a batch of user prompts from a coding session (only the human's instructions to an AI coding assistant). Analyze them chronologically and identify 1 to 3 distinct stages of work.

For each stage return a JSON object with:
- stage_name: short name (2-5 words, e.g. "Database Auth Overhaul")
- summary: 2-3 sentences explaining what was built or attempted
- key_decisions: array of strings, important choices made (empty array if none)
- problems_hit: array of strings, issues encountered (empty array if none)

Return ONLY a JSON array of stage objects. No markdown, no explanation.`;

const REDUCE_SYSTEM = `You are a senior technical writer. You will receive a raw list of project stages extracted from a coding session. Merge and polish them into a perfectly cohesive final timeline of 4 to 8 major stages for a "How it was Built" blog post. Combine overlapping stages, remove duplicates, and ensure the narrative flows chronologically.

Also write a 2-sentence "hook" describing the overall project — make it compelling and specific.

Return ONLY valid JSON in this exact shape:
{
  "hook": "Two sentence hook here.",
  "stages": [
    {
      "stage_name": "Stage Name",
      "summary": "2-3 sentence summary.",
      "key_decisions": ["decision 1", "decision 2"],
      "problems_hit": ["problem 1"]
    }
  ]
}

No markdown fences, no explanation — just the JSON object.`;

// ── Helpers ──────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function parseJsonResponse<T>(text: string): T {
  // Strip markdown code fences if the model wraps them
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ── Map Phase ────────────────────────────────────────────────

async function mapChunk(
  messages: string[],
  chunkIndex: number,
  totalChunks: number
): Promise<RawStage[]> {
  const userContent = [
    `Chunk ${chunkIndex + 1} of ${totalChunks} (messages ${chunkIndex * CHUNK_SIZE + 1}-${chunkIndex * CHUNK_SIZE + messages.length}):`,
    "",
    ...messages.map((m, i) => `[${chunkIndex * CHUNK_SIZE + i + 1}] ${m}`),
  ].join("\n");

  const response = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: MAP_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const parsed = parseJsonResponse<RawStage[] | { stages: RawStage[] }>(raw);

  // Handle both array and object responses
  if (Array.isArray(parsed)) return parsed;
  if (parsed.stages && Array.isArray(parsed.stages)) return parsed.stages;
  return [];
}

// ── Reduce Phase ─────────────────────────────────────────────

async function reduceStages(
  rawStages: RawStage[],
  title: string
): Promise<{ hook: string; stages: RawStage[] }> {
  const userContent = [
    `Project title: "${title}"`,
    `Total raw stages to merge: ${rawStages.length}`,
    "",
    JSON.stringify(rawStages, null, 2),
  ].join("\n");

  const response = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REDUCE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return parseJsonResponse<{ hook: string; stages: RawStage[] }>(raw);
}

// ── Public API ───────────────────────────────────────────────

export async function compileProjectTimeline(
  userMessagesText: string[],
  title: string
): Promise<CompiledTimeline> {
  if (userMessagesText.length === 0) {
    throw new Error("Cannot compile timeline from empty messages");
  }

  const chunks = chunk(userMessagesText, CHUNK_SIZE);

  // ── MAP: process all chunks concurrently ──
  let allRawStages: RawStage[];

  try {
    const chunkResults = await Promise.all(
      chunks.map((msgs, i) => mapChunk(msgs, i, chunks.length))
    );
    allRawStages = chunkResults.flat();
  } catch (err) {
    throw new Error(
      `Map phase failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (allRawStages.length === 0) {
    throw new Error("Map phase produced no stages");
  }

  // ── REDUCE: merge into final timeline ──
  let reduced: { hook: string; stages: RawStage[] };

  try {
    reduced = await reduceStages(allRawStages, title);
  } catch (err) {
    throw new Error(
      `Reduce phase failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!reduced.hook || !reduced.stages?.length) {
    throw new Error("Reduce phase returned incomplete data");
  }

  // ── Distribute duration_messages proportionally ──
  const totalMessages = userMessagesText.length;
  const stageCount = reduced.stages.length;
  const basePerStage = Math.floor(totalMessages / stageCount);
  const remainder = totalMessages % stageCount;

  const stages: CompiledStage[] = reduced.stages.map((s, i) => ({
    stage_name: s.stage_name,
    summary: s.summary,
    key_decisions: s.key_decisions ?? [],
    problems_hit: s.problems_hit ?? [],
    duration_messages: basePerStage + (i < remainder ? 1 : 0),
  }));

  return { hook: reduced.hook, stages };
}
