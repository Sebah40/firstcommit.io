import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchProfileByUsernameServer,
  fetchUserGuidesServer,
} from "@/lib/supabase/queries/profile.server";
import { ProfilePageClient } from "@/components/profile/profile-page-client";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchProfileByUsernameServer(supabase, username);

  if (!profile) {
    return { title: "Profile not found — First Commit" };
  }

  const displayName = profile.display_name || profile.username;
  const title = `${displayName} — First Commit`;
  const description = profile.bio || `${displayName}'s build guides on First Commit`;

  return {
    title,
    description,
    openGraph: {
      title: displayName,
      description,
      url: `https://firstcommit.io/profile/${username}`,
      type: "profile",
      ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
    twitter: {
      card: "summary",
      title: displayName,
      description,
    },
    alternates: {
      canonical: `https://firstcommit.io/profile/${username}`,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await fetchProfileByUsernameServer(supabase, username);
  if (!profile) {
    notFound();
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialGuides = await fetchUserGuidesServer(supabase, profile.id);
  const isOwner = !!user && user.id === profile.id;

  return (
    <ProfilePageClient
      profile={profile}
      currentUserId={user?.id ?? null}
      isOwner={isOwner}
      initialGuides={initialGuides}
    />
  );
}
