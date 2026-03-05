-- Allow anonymous posts (user_id can be null)
ALTER TABLE public.posts ALTER COLUMN user_id DROP NOT NULL;

-- Anonymous posts are viewable by everyone (existing policy covers this via is_hidden = false)
-- Anonymous posts cannot be edited or deleted (RLS policies require auth.uid() = user_id, which won't match null)
