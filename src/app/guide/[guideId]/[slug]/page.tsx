import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGuideByIdServer,
  fetchGuideCommentsServer,
  fetchRecommendedGuidesServer,
} from "@/lib/supabase/queries/guide-detail.server";
import { GuideDetailClient } from "@/components/guide/guide-detail-client";

interface GuideDetailPageProps {
  params: Promise<{ guideId: string; slug: string }>;
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { guideId } = await params;
  const supabase = await createClient();

  const guide = await fetchGuideByIdServer(supabase, guideId);
  if (!guide) {
    notFound();
  }

  const [comments, recommended] = await Promise.all([
    fetchGuideCommentsServer(supabase, guideId),
    fetchRecommendedGuidesServer(supabase, guideId, guide.category_id),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile if logged in
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  return (
    <GuideDetailClient
      guide={guide}
      initialComments={comments}
      recommended={recommended}
      user={user}
      userProfile={userProfile}
    />
  );
}
