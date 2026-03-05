-- ============================================
-- 015: Pivot to Post Stages
-- ============================================
-- Drop raw-log tables (chat_messages, progress_logs) and their
-- dependents. Create post_stages for chunked project timelines.
-- Rename posts.description → hook_description.

-- 1. Drop dependents of chat_messages
DROP TRIGGER IF EXISTS on_message_star_change ON public.message_stars;
DROP FUNCTION IF EXISTS public.update_post_stars_count();
DROP TABLE IF EXISTS public.message_stars CASCADE;

-- 2. Drop chat_messages
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- 3. Drop vector search function + progress_logs
DROP FUNCTION IF EXISTS public.match_progress_logs(vector, float, int);
DROP TABLE IF EXISTS public.progress_logs CASCADE;

-- 4. Rename description → hook_description on posts
ALTER TABLE public.posts RENAME COLUMN description TO hook_description;

-- 5. Create post_stages
CREATE TABLE public.post_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  stage_order integer NOT NULL,
  stage_name text NOT NULL,
  summary text NOT NULL,
  key_decisions text[] DEFAULT '{}',
  problems_hit text[] DEFAULT '{}',
  duration_messages integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_post_stages_post_order ON public.post_stages (post_id, stage_order);

-- 6. RLS for post_stages
ALTER TABLE public.post_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_stages_select" ON public.post_stages
  FOR SELECT USING (true);

CREATE POLICY "post_stages_insert" ON public.post_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "post_stages_update" ON public.post_stages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "post_stages_delete" ON public.post_stages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );
