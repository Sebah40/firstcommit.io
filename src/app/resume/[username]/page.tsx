import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileByUsernameServer } from "@/lib/supabase/queries/profile.server";
import { ResumeLangToggle } from "@/components/resume/resume-lang-toggle";
import type { Metadata } from "next";
import type { ResumeData } from "@/types";

interface ResumePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ResumePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchProfileByUsernameServer(supabase, username);
  const name = (profile?.resume_data as ResumeData | null)?.basics?.name || profile?.display_name || username;

  return {
    title: `${name} — Resume | First Commit`,
    description: `${name}'s living resume, automatically updated from AI-assisted build projects.`,
  };
}

export default async function ResumePage({ params }: ResumePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchProfileByUsernameServer(supabase, username);

  if (!profile || !profile.resume_data) {
    notFound();
  }

  const hasPdf = !!profile.resume_pdf_url;
  const hasEs = !!profile.resume_pdf_url_es;

  if (!hasPdf) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-sm">
          Resume PDF not generated yet.
        </p>
        <p className="mt-2 text-xs text-muted-foreground opacity-60">
          Use the <code className="font-mono">firstcommit_update_resume</code> MCP tool to generate it.
        </p>
      </div>
    );
  }

  const data = profile.resume_data as ResumeData;
  const links: Array<{ label: string; url: string }> = [];
  if (data.basics?.url) {
    const u = data.basics.url.startsWith("http") ? data.basics.url : `https://${data.basics.url}`;
    links.push({ label: "LinkedIn", url: u });
  }
  for (const cert of data.certifications ?? []) {
    if (cert.url) links.push({ label: cert.name, url: cert.url });
  }
  for (const proj of data.projects ?? []) {
    if (proj.url) links.push({ label: proj.name, url: proj.url });
  }

  return (
    <div
      className="-mx-4 -my-6 sm:-mx-6"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <ResumeLangToggle username={username} hasEs={hasEs} links={links} />
    </div>
  );
}
