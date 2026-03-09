import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileByUsernameServer } from "@/lib/supabase/queries/profile.server";
import { ResumeView } from "@/components/resume/resume-view";
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

  return (
    <ResumeView
      resumeData={profile.resume_data as ResumeData}
      username={profile.username}
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
      cvUrl={profile.cv_url}
      updatedAt={profile.resume_updated_at}
    />
  );
}
