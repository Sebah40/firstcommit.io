"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { GuideGrid } from "@/components/gallery/guide-grid";
import { CommentList } from "@/components/profile/comment-list";
import { ProfileEmptyState } from "@/components/profile/profile-empty-state";
import {
  fetchUserComments,
  fetchUserLikedGuides,
  fetchUserSavedGuides,
} from "@/lib/supabase/queries/profile";
import { Loader2 } from "lucide-react";
import type { Profile, ProfileTab, Guide, Comment } from "@/types";

interface ProfilePageClientProps {
  profile: Profile;
  currentUserId: string | null;
  isOwner: boolean;
  initialGuides: Guide[];
}

export function ProfilePageClient({
  profile: initialProfile,
  currentUserId,
  isOwner,
  initialGuides,
}: ProfilePageClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [activeTab, setActiveTab] = useState<ProfileTab>("guides");
  const [tabData, setTabData] = useState<{ [key in ProfileTab]?: Guide[] | Comment[] }>({
    guides: initialGuides,
  });
  const [tabLoading, setTabLoading] = useState(false);

  const showLiked = profile.show_likes || isOwner;
  const showSaved = profile.show_saves || isOwner;

  // If active tab is no longer visible, fall back to "guides"
  const effectiveTab =
    (activeTab === "liked" && !showLiked) || (activeTab === "saved" && !showSaved)
      ? "guides"
      : activeTab;

  // Reset tab data when profile updates (e.g. after edit changes privacy)
  function handleProfileUpdate(updated: Profile) {
    setProfile(updated);
    // Keep guides data, reset others
    setTabData({ guides: tabData.guides });
  }

  async function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab);

    // Load data if not already cached
    if (!tabData[tab]) {
      setTabLoading(true);
      let data: Guide[] | Comment[] = [];
      switch (tab) {
        case "guides":
          // Already loaded from server
          break;
        case "comments":
          data = await fetchUserComments(profile.id);
          break;
        case "liked":
          data = await fetchUserLikedGuides(profile.id);
          break;
        case "saved":
          data = await fetchUserSavedGuides(profile.id);
          break;
      }
      setTabData((prev) => ({ ...prev, [tab]: data }));
      setTabLoading(false);
    }
  }

  const currentData = tabData[effectiveTab];

  return (
    <div>
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        onProfileUpdate={handleProfileUpdate}
      />

      <div className="mb-6">
        <ProfileTabs
          active={effectiveTab}
          onChange={handleTabChange}
          showLiked={showLiked}
          showSaved={showSaved}
        />
      </div>

      {tabLoading || !currentData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : currentData.length === 0 ? (
        <ProfileEmptyState tab={effectiveTab} isOwner={isOwner} />
      ) : effectiveTab === "comments" ? (
        <CommentList comments={currentData as Comment[]} />
      ) : (
        <GuideGrid guides={currentData as Guide[]} />
      )}
    </div>
  );
}
