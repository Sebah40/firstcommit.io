import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";

const BASE_URL = "https://firstcommit.io";

function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const supabase = getReadClient();

  const { data: guides } = await supabase
    .from("posts")
    .select(`
      id, title, hook_description, created_at, updated_at,
      profile:profiles!posts_user_id_fkey(username, display_name)
    `)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (guides ?? [])
    .map((g: any) => {
      const author = g.profile?.display_name || g.profile?.username || "Unknown";
      const url = `${BASE_URL}/guide/${g.id}/${slugify(g.title)}`;
      return `    <item>
      <title><![CDATA[${g.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${g.hook_description || ""}]]></description>
      <author>${author}</author>
      <pubDate>${new Date(g.created_at).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>First Commit</title>
    <link>${BASE_URL}</link>
    <description>See how it was built. Developers share step-by-step build stories from first commit to production.</description>
    <language>en</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
