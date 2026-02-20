-- Add privacy toggles to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_saves boolean NOT NULL DEFAULT true;
