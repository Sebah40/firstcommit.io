import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";

const BASE_URL = "https://firstcommit.io";

function getReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getReadClient();

  // Fetch all public guides
  const { data: guides } = await supabase
    .from("posts")
    .select("id, title, updated_at")
    .eq("is_hidden", false)
    .order("updated_at", { ascending: false });

  // Fetch all profiles with at least one guide
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, created_at");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = (guides ?? []).map((guide) => ({
    url: `${BASE_URL}/guide/${guide.id}/${slugify(guide.title)}`,
    lastModified: new Date(guide.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${BASE_URL}/profile/${p.username}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...guideRoutes, ...profileRoutes];
}
