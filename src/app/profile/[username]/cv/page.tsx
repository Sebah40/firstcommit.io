import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileByUsernameServer } from "@/lib/supabase/queries/profile.server";
import type { Metadata } from "next";

interface CvPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: CvPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s CV — First Commit`,
  };
}

export default async function CvPage({ params }: CvPageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchProfileByUsernameServer(supabase, username);

  if (!profile || !profile.cv_url) {
    notFound();
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 sm:px-6">
        <div className="flex items-center gap-3">
          <a
            href={`/profile/${username}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; {profile.display_name || username}
          </a>
          <span className="text-sm text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground">CV</span>
        </div>
        <a
          href={profile.cv_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
        >
          Download
        </a>
      </div>
      <iframe
        src={profile.cv_url}
        className="flex-1 w-full border-0"
        title={`${username}'s CV`}
      />
    </div>
  );
}
