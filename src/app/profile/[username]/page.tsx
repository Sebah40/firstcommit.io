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

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await fetchProfileByUsernameServer(supabase, username);
  if (!profile) {
    notFound();
  }
  console.log("[ProfilePage] fetched profile karma:", profile.karma, "full profile:", JSON.stringify(profile));

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
