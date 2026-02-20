"use client";

import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CommentItem } from "./comment-item";
import { createComment, buildCommentTree } from "@/lib/supabase/queries/guide-detail";
import { formatNumber } from "@/lib/utils";
import type { Comment } from "@/types";

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  userId?: string | null;
  userUsername?: string;
  userAvatarUrl?: string | null;
}

export function CommentSection({
  postId,
  initialComments,
  userId,
  userUsername,
  userAvatarUrl,
}: CommentSectionProps) {
  const [flatComments, setFlatComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tree = buildCommentTree(flatComments);

  async function handleSubmit() {
    if (!userId || !content.trim()) return;
    setSubmitting(true);

    const newComment = await createComment(postId, userId, content.trim());

    if (newComment) {
      setFlatComments((prev) => [...prev, newComment]);
      setContent("");
    }
    setSubmitting(false);
  }

  const handleReplyAdded = useCallback((reply: Comment) => {
    setFlatComments((prev) => [...prev, reply]);
  }, []);

  const handleCommentUpdated = useCallback((commentId: string, content: string) => {
    setFlatComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content } : c))
    );
  }, []);

  const handleCommentDeleted = useCallback((commentId: string) => {
    setFlatComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle size={18} className="text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        {flatComments.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {formatNumber(flatComments.length)}
          </span>
        )}
      </div>

      {/* Compose box */}
      {userId && (
        <div className="mb-6 flex gap-3">
          <Avatar
            userId={userId}
            username={userUsername ?? "?"}
            avatarUrl={userAvatarUrl}
            size="md"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full resize-none rounded-lg bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      {tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <MessageCircle size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No comments yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              userId={userId}
              userUsername={userUsername}
              userAvatarUrl={userAvatarUrl}
              onReplyAdded={handleReplyAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
