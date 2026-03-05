import { createClient } from "@/lib/supabase/server";
import { fetchGuidesServer } from "@/lib/supabase/queries/guides.server";
import { GuideGrid } from "@/components/gallery/guide-grid";
import { HomeHeader } from "@/components/gallery/home-header";
import { SortTabsServer } from "@/components/gallery/sort-tabs-server";
import type { SortOption } from "@/types";

interface HomeProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { q: query, sort = "trending" } = await searchParams;
  const validSort = ["trending", "recent", "popular"].includes(sort) ? sort : "trending";

  const supabase = await createClient();
  const guides = await fetchGuidesServer(supabase, validSort, query);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <HomeHeader query={query} count={guides.length} />
        <SortTabsServer active={validSort as SortOption} query={query} />
      </div>

      {/* Grid */}
      <GuideGrid guides={guides} />
    </div>
  );
}
