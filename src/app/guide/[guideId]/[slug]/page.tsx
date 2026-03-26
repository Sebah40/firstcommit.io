import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGuideByIdServer,
  fetchGuideCommentsServer,
  fetchRecommendedGuidesServer,
} from "@/lib/supabase/queries/guide-detail.server";
import { GuideDetailClient } from "@/components/guide/guide-detail-client";
import { slugify } from "@/lib/utils";

interface GuideDetailPageProps {
  params: Promise<{ guideId: string; slug: string }>;
}

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { guideId } = await params;
  const supabase = await createClient();
  const guide = await fetchGuideByIdServer(supabase, guideId);

  if (!guide) {
    return { title: "Guide not found — First Commit" };
  }

  const title = `${guide.title} — First Commit`;
  const description = guide.hook_description || `Build guide: ${guide.title}`;
  const url = `https://firstcommit.io/guide/${guideId}/${slugify(guide.title)}`;

  return {
    title,
    description,
    openGraph: {
      title: guide.title,
      description,
      url,
      type: "article",
      siteName: "First Commit",
      publishedTime: guide.created_at,
      modifiedTime: guide.updated_at,
      authors: guide.profile?.display_name || guide.profile?.username ? [guide.profile.display_name || guide.profile.username] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.hook_description || `Build guide: ${guide.title}`,
    url: `https://firstcommit.io/guide/${guideId}/${slugify(guide.title)}`,
    datePublished: guide.created_at,
    dateModified: guide.updated_at,
    author: guide.profile
      ? {
          "@type": "Person",
          name: guide.profile.display_name || guide.profile.username,
          url: `https://firstcommit.io/profile/${guide.profile.username}`,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "First Commit",
      url: "https://firstcommit.io",
    },
    keywords: guide.techs?.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GuideDetailClient
        guide={guide}
        initialComments={comments}
        recommended={recommended}
        user={user}
        userProfile={userProfile}
      />
    </>
  );
}
