import { createClient } from "@/lib/supabase/server";
import { fetchGuidesServer } from "@/lib/supabase/queries/guides.server";
import { GuideGrid } from "@/components/gallery/guide-grid";
import { GuideFeed } from "@/components/gallery/guide-feed";
import { HomeHeader } from "@/components/gallery/home-header";
import { HomeSidebar } from "@/components/gallery/home-sidebar";
import { SortTabsServer } from "@/components/gallery/sort-tabs-server";
import { ViewToggle, type ViewType } from "@/components/gallery/view-toggle";
import type { SortOption } from "@/types";

interface HomeProps {
  searchParams: Promise<{ q?: string; sort?: string; view?: string; tech?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { q: query, sort = "trending", view = "feed", tech } = await searchParams;
  const validSort = ["trending", "recent", "popular"].includes(sort) ? sort : "trending";
  const validView: ViewType = view === "grid" ? "grid" : "feed";

  const supabase = await createClient();

  // Fetch all guides (cached by unstable_cache)
  const allGuides = await fetchGuidesServer(supabase, validSort);

  // Apply filters
  let guides = query
    ? await fetchGuidesServer(supabase, validSort, query)
    : allGuides;

  if (tech) {
    guides = guides.filter((g) =>
      g.techs.some((t) => t.toLowerCase() === tech.toLowerCase())
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <HomeHeader query={query || tech} count={guides.length} />
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <SortTabsServer active={validSort as SortOption} query={query} />
          <ViewToggle view={validView} />
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="flex gap-8">
        <div className="min-w-0 flex-1">
          {validView === "grid" ? (
            <GuideGrid guides={guides} />
          ) : (
            <GuideFeed guides={guides} />
          )}
        </div>

        <aside className="hidden xl:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <HomeSidebar guides={allGuides} activeTech={tech} />
          </div>
        </aside>
      </div>
    </div>
  );
}
