import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const TOKEN_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// Auth: verify First Commit JWT (minted by /api/mcp/oauth/token, 30-day TTL)
// ---------------------------------------------------------------------------

const verifyToken = async (
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  try {
    const { payload } = await jwtVerify(bearerToken, TOKEN_SECRET, {
      issuer: "firstcommit",
    });
    if (!payload.sub) return undefined;

    return {
      token: bearerToken,
      clientId: payload.sub,
      scopes: [],
      extra: { userId: payload.sub },
    };
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// Supabase helper (service role for DB writes)
// ---------------------------------------------------------------------------

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// MCP handler with tools
// ---------------------------------------------------------------------------

const handler = createMcpHandler(
  (server) => {
    // ── firstcommit_publish ──────────────────────────────
    server.registerTool(
      "firstcommit_publish",
      {
        title: "Publish Timeline",
        description: `Publish a "How it was Built" post to First Commit.

IMPORTANT: Follow these steps EXACTLY. Do NOT improvise or add extra exploration steps.

## Step 0: Auth check

Call this tool with title="__auth_check__" and all other fields empty/zero. If auth fails, ask the user whether to sign up or post anonymously. Do NOT read files until auth is resolved.

## Step 1: Gather everything in ONE parallel step

Run ALL of these in a SINGLE message (parallel tool calls):

**1a) Count sessions + messages.** Run this ONE command (Claude Code):
for f in ~/.claude/projects/$(pwd | sed 's|/|-|g; s|^-||')/*.jsonl; do bn=$(basename "$f"); [[ "$bn" == agent-* ]] && continue; c=$(grep -c '"type":"user"' "$f" 2>/dev/null || echo 0); echo "$c $bn"; done | sort -rn | awk '{s+=$1; n++; print} END{print "---"; print s " total user messages across " n " sessions"}'

For Gemini CLI: check ~/.gemini/history/*.json. For Cursor: check .cursor/ or ~/Library/Application Support/Cursor/. If no session files exist, use your current conversation context (set total_sessions_read=1).

**1b) Get tech stack.** Read package.json (or equivalent: requirements.txt, Cargo.toml, go.mod, etc.) to extract all technologies. Do NOT guess techs from session files.

**1c) Get project context.** Read README.md if it exists, and run "git log --oneline -20" for commit history.

**1d) Ask the user** (in the SAME message): "Do you have a live deployed URL for this project?"

## Step 2: Read session content (ONE command per session)

For EACH session file from Step 1a, run ONE command to extract all user text messages:
grep '"type":"user"' <file> | python3 -c "import sys,json; [print(f'[{i}]',json.loads(l)['message']['content'] if isinstance(json.loads(l)['message']['content'],str) else '[tool_result]') for i,l in enumerate(sys.stdin) if isinstance(json.loads(l).get('message',{}).get('content'),None.__class__)==False]" 2>/dev/null | head -80

Run ALL session files in parallel. For sessions with 200+ messages, this head -80 captures enough. Do NOT run multiple grep commands per file or explore files one by one.

## Step 3: Publish

Call this tool with all fields populated. Do NOT make a second pass to "verify" or "refine" — publish on the first call.

WRITING RULES:
- BUILD GUIDE, not changelog. Write in narrative form: "We started by..., discovered that..., which led to..."
- PRIVACY: Never include internal DB names, API keys, internal URLs, employee names, or proprietary code. Describe WHAT was built generically.
- SCALE: ~1 stage per 100-200 user messages. 200 msgs → 2-4 stages. 1000 msgs → 6-10 stages.
- title: Compelling blog-style title covering the full project scope
- hook: 2-3 sentences. What was built, why it's interesting.
- body: Main content (markdown, 500-2000 words). Dev blog style narrative — set the scene, narrate the arc, highlight challenges and breakthroughs. NOT a summary — it's the story.
- techs: From package.json, not guessed
- stages: Each has stage_name (2-5 words), summary (5-15 sentences, narrative walkthrough), key_decisions (choices + why), problems_hit ("tried X, failed because Y, solved with Z"), duration_messages
- duration_messages across all stages should roughly equal total_user_messages from Step 1a.

THE ENTIRE PUBLISH FLOW SHOULD TAKE 3 TOOL CALLS: auth check → gather + read (parallel) → publish. Not 10+.`,
        inputSchema: {
          title: z.string().describe("Compelling blog-style post title"),
          hook: z
            .string()
            .describe(
              "2-sentence hook description that makes people want to read the timeline"
            ),
          body: z
            .string()
            .describe(
              "Main post content in markdown (500-2000 words). Dev blog style narrative of the full build journey."
            ),
          techs: z
            .array(z.string())
            .describe("ALL technologies used across the entire project"),
          total_sessions_read: z
            .number()
            .describe(
              "Total number of .jsonl session files you read. Must match the actual count in the project directory."
            ),
          total_user_messages: z
            .number()
            .describe(
              "Total user messages found across ALL session files. Must be the real count, not an estimate."
            ),
          instance_url: z
            .string()
            .optional()
            .describe(
              "The live URL where the project is deployed (e.g. https://myapp.com). Ask the user if they have one."
            ),
          anonymous: z
            .boolean()
            .optional()
            .default(false)
            .describe(
              "Set to true ONLY if the user explicitly confirmed they want to post without signing up. Do not set this on your own."
            ),
          stages: z
            .array(
              z.object({
                stage_name: z
                  .string()
                  .describe("Short stage name (2-5 words)"),
                summary: z
                  .string()
                  .describe("2-3 sentence summary of what was built"),
                key_decisions: z
                  .array(z.string())
                  .describe("Important architectural/design choices made"),
                problems_hit: z
                  .array(z.string())
                  .describe("Issues encountered and how they were resolved"),
                duration_messages: z
                  .number()
                  .describe(
                    "Approximate number of user messages this stage covers"
                  ),
              })
            )
            .describe("4-12 chronological project stages covering the FULL project history"),
        },
      },
      async ({ title, hook, body, techs, total_sessions_read, total_user_messages, instance_url, anonymous, stages }, extra) => {
        const userId = (extra.authInfo?.extra as { userId?: string })?.userId;

        // Auth check shortcut
        if (title === "__auth_check__") {
          if (userId) {
            return {
              content: [
                { type: "text" as const, text: "Auth OK. Proceed with reading session files." },
              ],
            };
          }
          // Not authenticated — offer anonymous posting
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  "You are NOT signed in to First Commit.",
                  "",
                  "You have two options:",
                  "1. Sign up first: run `claude mcp add --transport http firstcommit https://firstcommit.io/api/mcp` and authenticate in the browser. Your post will be linked to your profile and you can edit/delete it later.",
                  "2. Post anonymously: you can publish right now without an account, BUT you will NOT be able to edit or delete the post later. It's permanent.",
                  "",
                  "Ask the user: \"Would you like to sign up first, or post anonymously? (Anonymous posts can't be edited or deleted later.)\"",
                  "",
                  "If they choose anonymous, proceed with reading session files and set `anonymous: true` when calling this tool to publish.",
                  "If they choose to sign up, tell them to run the MCP add command above and reauthenticate.",
                ].join("\n"),
              },
            ],
          };
        }

        // For actual publish: require auth OR explicit anonymous flag
        if (!userId && !anonymous) {
          return {
            content: [
              { type: "text" as const, text: "Error: Authentication required and anonymous flag not set. Run the auth check first (title: \"__auth_check__\") to offer the user the choice." },
            ],
          };
        }

        // Warn if suspiciously few sessions were read
        if (total_sessions_read < 1) {
          return {
            content: [
              {
                type: "text" as const,
                text: `REJECTED: You reported reading only ${total_sessions_read} session file(s). Most projects have many more. Go back and read ALL .jsonl files in the project directory before publishing. Do not skip sessions.`,
              },
            ],
          };
        }

        const supabase = getSupabase();
        const totalMessages = total_user_messages || stages.reduce(
          (sum, s) => sum + (s.duration_messages || 0),
          0
        );

        const postInsert: Record<string, unknown> = {
          title: title.trim(),
          hook_description: hook.trim(),
          content: body.trim(),
          techs,
          message_count: totalMessages,
        };
        if (instance_url) postInsert.instance_url = instance_url.trim();
        if (userId && !anonymous) postInsert.user_id = userId;

        const { data: post, error: postError } = (await supabase
          .from("posts")
          .insert(postInsert)
          .select("id")
          .single()) as { data: any; error: any };

        if (postError || !post) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error creating post: ${postError?.message ?? "unknown"}`,
              },
            ],
          };
        }

        const stageRows = stages.map((s, i) => ({
          post_id: post.id,
          stage_order: i + 1,
          stage_name: s.stage_name,
          summary: s.summary,
          key_decisions: s.key_decisions ?? [],
          problems_hit: s.problems_hit ?? [],
          duration_messages: s.duration_messages ?? 0,
        }));

        const { error: stagesError } = await supabase
          .from("post_stages")
          .insert(stageRows);

        if (stagesError) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Post created but stages failed: ${stagesError.message}`,
              },
            ],
          };
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const postUrl = `${baseUrl}/guide/${post.id}/${slugify(title)}`;

        const lines = [
          `POST PUBLISHED!`,
          ``,
          `"${title}"`,
          postUrl,
          ``,
          `${stages.length} stages | ${techs.join(", ")}`,
          ``,
          `"${hook}"`,
        ];
        if (!userId || anonymous) {
          lines.push(``, `Note: This was posted anonymously. It cannot be edited or deleted.`);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: lines.join("\n"),
            },
          ],
        };
      }
    );

    // ── firstcommit_search ───────────────────────────────────────
    server.registerTool(
      "firstcommit_search",
      {
        title: "Search First Commit",
        description: `Search First Commit for posts about specific topics, technologies, or problems. Use this when you want to find how other people solved a similar problem.`,
        inputSchema: {
          query: z.string().describe("Search query"),
          limit: z
            .number()
            .optional()
            .default(10)
            .describe("Max results (default 10)"),
        },
      },
      async ({ query, limit }) => {
        const supabase = getSupabase();
        const searchTerm = `%${query.trim()}%`;
        const maxLimit = Math.min(limit ?? 10, 50);

        const { data, error } = (await supabase
          .from("posts")
          .select(
            "id, title, hook_description, techs, likes_count, comments_count, profile:profiles!posts_user_id_fkey(username)"
          )
          .eq("is_hidden", false)
          .or(
            `title.ilike.${searchTerm},hook_description.ilike.${searchTerm}`
          )
          .order("trending_score", { ascending: false })
          .limit(maxLimit)) as { data: any; error: any };

        if (error) {
          return {
            content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          };
        }
        if (!data?.length) {
          return {
            content: [
              { type: "text" as const, text: `No results found for "${query}".` },
            ],
          };
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const lines = data.map((r: any, i: number) => {
          return [
            `${i + 1}. **${r.title}**`,
            `   ${r.hook_description || "No description"}`,
            `   Techs: ${r.techs?.join(", ") || "none"}`,
            `   Author: ${r.profile?.username || "unknown"}`,
            `   URL: ${baseUrl}/guide/${r.id}/${slugify(r.title)}`,
            `   Post ID: ${r.id}`,
          ].join("\n");
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${data.length} results for "${query}":\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      }
    );

  },
  {},
  {
    basePath: "/api",
    verboseLogs: true,
  }
);

const authHandler = withMcpAuth(handler, verifyToken, {
  required: false,
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
