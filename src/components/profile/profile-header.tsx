"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber, formatJoinDate } from "@/lib/utils";
import { updateProfile } from "@/lib/supabase/queries/profile";
import { Star, Calendar, Pencil, X, Check, Github, Linkedin } from "lucide-react";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isOwner: boolean;
  onProfileUpdate: (profile: Profile) => void;
}

export function ProfileHeader({ profile, isOwner, onProfileUpdate }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [showLikes, setShowLikes] = useState(profile.show_likes ?? false);
  const [showSaves, setShowSaves] = useState(profile.show_saves ?? false);
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  function startEditing() {
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setShowLikes(profile.show_likes ?? false);
    setShowSaves(profile.show_saves ?? false);
    setGithubUrl(profile.github_url ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveEdits() {
    setSaving(true);
    const updated = await updateProfile(profile.id, {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      show_likes: showLikes,
      show_saves: showSaves,
      github_url: githubUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    });
    setSaving(false);

    if (updated) {
      onProfileUpdate(updated);
      setEditing(false);
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-start gap-5">
        <Avatar
          userId={profile.id}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="xl"
        />

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="rounded-lg bg-muted px-3 py-1.5 text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio..."
                rows={2}
                className="resize-none rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-col gap-2">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="GitHub URL (e.g. https://github.com/user)"
                  className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="LinkedIn URL (e.g. https://linkedin.com/in/user)"
                  className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showLikes}
                    onChange={(e) => setShowLikes(e.target.checked)}
                    className="accent-accent"
                  />
                  Show liked posts on profile
                </label>
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showSaves}
                    onChange={(e) => setShowSaves(e.target.checked)}
                    className="accent-accent"
                  />
                  Show saved posts on profile
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={14} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {profile.display_name || profile.username}
                </h1>
                {isOwner && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil size={12} />
                    Edit Profile
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-2 text-sm text-foreground">{profile.bio}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  {formatNumber(profile.karma)} karma
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatJoinDate(profile.created_at)}
                </span>
              </div>
              {(profile.github_url || profile.linkedin_url) && (
                <div className="mt-3 flex items-center gap-2">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Github size={16} />
                      GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Linkedin size={16} />
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
