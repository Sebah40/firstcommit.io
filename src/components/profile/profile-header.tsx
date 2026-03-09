"use client";

import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber, formatJoinDate } from "@/lib/utils";
import { updateProfile } from "@/lib/supabase/queries/profile";
import { createClient } from "@/lib/supabase/client";
import { Star, Calendar, Pencil, X, Check, Github, Linkedin, Camera, FileText, Upload, Trash2, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isOwner: boolean;
  onProfileUpdate: (profile: Profile) => void;
}

export function ProfileHeader({ profile, isOwner, onProfileUpdate }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [showLikes, setShowLikes] = useState(profile.show_likes ?? false);
  const [showSaves, setShowSaves] = useState(profile.show_saves ?? false);
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";

    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadErr) {
      console.error("Avatar upload failed:", uploadErr.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
    const updated = await updateProfile(profile.id, { avatar_url: urlData.publicUrl });

    if (updated) onProfileUpdate(updated);
    setUploadingAvatar(false);
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    e.target.value = "";

    setUploadingCv(true);
    const supabase = createClient();
    const path = `cvs/${profile.id}/${Date.now()}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: "application/pdf", upsert: true });

    if (uploadErr) {
      console.error("CV upload failed:", uploadErr.message);
      setUploadingCv(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
    const updated = await updateProfile(profile.id, { cv_url: urlData.publicUrl });

    if (updated) onProfileUpdate(updated);

    // Parse PDF into structured resume data
    try {
      const formData = new FormData();
      formData.append("file", file);
      const parseResp = await fetch("/api/resume/parse", { method: "POST", body: formData });
      if (parseResp.ok) {
        const { resume_data } = await parseResp.json();
        if (resume_data) {
          const withResume = await updateProfile(profile.id, {
            resume_data,
            resume_updated_at: new Date().toISOString(),
          });
          if (withResume) onProfileUpdate(withResume);
        }
      }
    } catch { /* parsing is best-effort */ }

    setUploadingCv(false);
  }

  async function handleCvRemove() {
    setUploadingCv(true);
    const supabase = createClient();

    // Try to delete from storage
    if (profile.cv_url) {
      try {
        const url = new URL(profile.cv_url);
        const storagePath = url.pathname.split("/post-media/")[1];
        if (storagePath) {
          await supabase.storage.from("post-media").remove([decodeURIComponent(storagePath)]);
        }
      } catch { /* best effort */ }
    }

    const updated = await updateProfile(profile.id, { cv_url: null });
    if (updated) onProfileUpdate(updated);
    setUploadingCv(false);
  }

  return (
    <div className="mb-8">
      <div className="flex items-start gap-5">
        {/* Avatar with upload overlay */}
        <div className="relative group shrink-0">
          <Avatar
            userId={profile.id}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size="xl"
          />
          {isOwner && (
            <>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera size={20} className="text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.displayName")}
                className="rounded-lg bg-muted px-3 py-1.5 text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                rows={2}
                className="resize-none rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-col gap-2">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder={t("profile.githubPlaceholder")}
                  className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder={t("profile.linkedinPlaceholder")}
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
                  {t("profile.showLiked")}
                </label>
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showSaves}
                    onChange={(e) => setShowSaves(e.target.checked)}
                    className="accent-accent"
                  />
                  {t("profile.showSaved")}
                </label>
              </div>

              {/* CV upload in edit mode */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("profile.cv")}
                </label>
                {profile.cv_url ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-accent hover:underline"
                    >
                      <FileText size={14} />
                      {t("profile.viewCv")}
                    </a>
                    <button
                      onClick={handleCvRemove}
                      disabled={uploadingCv}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => cvInputRef.current?.click()}
                      disabled={uploadingCv}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Upload size={14} />
                      {t("profile.replaceCv")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => cvInputRef.current?.click()}
                    disabled={uploadingCv}
                    className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-border/60 px-4 py-2.5 text-sm text-muted-foreground hover:border-accent/40 hover:text-foreground transition-colors"
                  >
                    {uploadingCv ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <FileText size={16} />
                    )}
                    {uploadingCv ? t("common.saving") : t("profile.uploadCv")}
                  </button>
                )}
                <input
                  ref={cvInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleCvUpload}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={14} />
                  {saving ? t("common.saving") : t("common.save")}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} />
                  {t("common.cancel")}
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
                    {t("profile.editProfile")}
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
                  {formatNumber(profile.karma)} {t("common.karma")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatJoinDate(profile.created_at)}
                </span>
              </div>
              {(profile.github_url || profile.linkedin_url || profile.cv_url || profile.resume_data) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {profile.resume_data && (
                    <a
                      href={`/resume/${profile.username}`}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-violet-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-[1.03]"
                    >
                      <Sparkles size={14} />
                      Living Resume
                    </a>
                  )}
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
                  {profile.cv_url && (
                    <a
                      href={`/profile/${profile.username}/cv`}
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <FileText size={16} />
                      {t("profile.cv")}
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
