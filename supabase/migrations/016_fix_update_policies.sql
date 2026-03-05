-- Fix soft-delete: PostgreSQL applies SELECT policies to the NEW row on UPDATE.
-- The existing SELECT policy (NOT is_hidden) rejects rows after setting is_hidden = true.
-- Fix: add permissive SELECT policies so owners can always see their own rows.

-- Comments
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Owners can see own comments"
  ON public.comments FOR SELECT
  USING (auth.uid() = user_id);

-- Posts
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Owners can see own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);
