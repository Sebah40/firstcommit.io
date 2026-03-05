"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export function InviteModal({ open, onClose, username }: InviteModalProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = `https://firstcommit.io/register?ref=${username}`;

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    const subject = encodeURIComponent(t("invite.emailSubject"));
    const body = encodeURIComponent(t("invite.emailBody").replace("{url}", inviteUrl));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function handleX() {
    const text = encodeURIComponent(t("invite.xText").replace("{url}", inviteUrl));
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener");
  }

  function handleLinkedIn() {
    const url = encodeURIComponent(inviteUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener");
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Link2 size={20} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t("invite.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("invite.subtitle")}</p>
        </div>

        {/* Link + Copy */}
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-muted/50 p-1">
          <span className="flex-1 truncate px-3 text-sm text-muted-foreground select-all">
            {inviteUrl}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              copied
                ? "bg-green-500/10 text-green-500"
                : "bg-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleEmail}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            <Mail size={18} className="text-muted-foreground" />
            {t("invite.sendEmail")}
          </button>
          <button
            onClick={handleX}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            <XIcon />
            {t("invite.shareX")}
          </button>
          <button
            onClick={handleLinkedIn}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            <LinkedInIcon />
            {t("invite.shareLinkedIn")}
          </button>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
