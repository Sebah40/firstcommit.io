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
        description: `Publish a "How it was Built" post to First Commit. This is a pure database insert — you must provide fully crafted content.

MANDATORY: Read ALL conversation files before publishing. DO NOT publish based on partial data.

## Step 1: Discover ALL conversation files

The project directory is at ~/.claude/projects/. The directory name is the project path with slashes replaced by dashes (e.g. -Users-jane-my-project/).

List ALL .jsonl files in the project directory. Exclude files starting with "agent-". A typical project has 5-30+ session files. If you only see 1-2, double-check the directory.

## Step 2: Read EVERY session file

For EACH .jsonl file, parse every line as JSON. Extract lines where type === "user". For each, get the text from message.content (may be a string or array of [{type:"text", text:"..."}] blocks).

You MUST process ALL session files, not just the current or most recent one. Report: "Processing X user messages across Y session files" before proceeding.

## Step 3: Craft the post

WRITING STYLE — This is a BUILD GUIDE, not a changelog. Each stage should read like a tutorial section. Someone with a similar tech stack should be able to follow your stages to build something comparable. Write in narrative form: "We started by..., then discovered that..., which led to..."

PRIVACY — NEVER include company-specific identifiers, internal column names, table names, variable names, API keys, internal URLs, employee names, or proprietary business logic. Instead, describe WHAT was built generically. Bad: "Built a query on Q$ART_CANT_CPRA_VTA to cross-reference ARTIC_EQUIV". Good: "Built a purchase-vs-sales comparison tool with product equivalence mapping to normalize different unit types (e.g. meters vs boxes)."

SCALE — Use roughly 1 stage per 100-200 user messages. A 200-message project gets 2-4 stages. A 1000-message project gets 6-10. A 5000-message project gets 15-25. Do NOT compress a massive project into 4 generic stages.

Fields:
- title: Compelling blog-style title covering the FULL project scope
- hook: 2-3 sentence description. What was built, why it's interesting, what makes the journey worth reading.
- body: The MAIN CONTENT of the post (markdown, 500-2000 words). This is what readers see first and what makes them stay. Write it like a dev blog post: set the scene (what problem existed, what the user wanted to build), narrate the high-level arc of the build journey, highlight the most interesting challenges and breakthroughs, and tease what the timeline stages will show in detail. This is NOT a summary — it's the story. Use headers, short paragraphs, and an engaging voice. A reader should finish the body thinking "I want to see exactly how they built each part" and then scroll into the stages.
- techs: ALL technologies used across the entire project
- stages: The detailed build timeline. Each stage has:
  - stage_name: Short name (2-5 words)
  - summary: A narrative walkthrough of this stage (5-15 sentences). Explain what was built, in what order, why those choices were made, what was tried that didn't work, and how problems were solved. Write it so someone could follow along to build something similar.
  - key_decisions: Choices made AND why. Include alternatives considered. "Used Supabase RLS instead of custom middleware — simpler to maintain and fewer auth edge cases."
  - problems_hit: Written as "tried X, failed because Y, solved with Z" — not just a label.
  - duration_messages: Approximate user messages this stage covers.

The sum of all duration_messages should roughly equal the total user messages found in Step 2.`,
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
      async ({ title, hook, body, techs, total_sessions_read, total_user_messages, stages }, extra) => {
        const userId = (extra.authInfo?.extra as { userId?: string })?.userId;
        if (!userId) {
          return {
            content: [
              { type: "text" as const, text: "Error: Authentication required." },
            ],
          };
        }

        // Warn if suspiciously few sessions were read
        if (total_sessions_read < 3) {
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

        const { data: post, error: postError } = (await supabase
          .from("posts")
          .insert({
            user_id: userId,
            title: title.trim(),
            hook_description: hook.trim(),
            content: body.trim(),
            techs,
            message_count: totalMessages,
          })
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

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `POST PUBLISHED!`,
                ``,
                `"${title}"`,
                postUrl,
                ``,
                `${stages.length} stages | ${techs.join(", ")}`,
                ``,
                `"${hook}"`,
              ].join("\n"),
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
