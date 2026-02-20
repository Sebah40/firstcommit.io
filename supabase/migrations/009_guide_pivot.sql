-- ============================================
-- PATHWAY - Guide Pivot (Phase 1)
-- ============================================
-- Adds guide-related columns to posts and creates new tables
-- for structured guide content (steps, blocks, completions).

-- ============================================
-- 1. New columns on posts
-- ============================================

ALTER TABLE public.posts ADD COLUMN difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced'));
ALTER TABLE public.posts ADD COLUMN time_estimate_minutes integer;
ALTER TABLE public.posts ADD COLUMN is_vibe_coded boolean DEFAULT false NOT NULL;
ALTER TABLE public.posts ADD COLUMN guide_type text DEFAULT 'other' NOT NULL
  CHECK (guide_type IN ('full_app','component','integration','automation','game','cli_tool','chrome_extension','other'));
ALTER TABLE public.posts ADD COLUMN prerequisites text[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.posts ADD COLUMN what_youll_build text;
ALTER TABLE public.posts ADD COLUMN original_json text;
ALTER TABLE public.posts ADD COLUMN completions_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN avg_rating numeric(3,2);

-- Indexes on new filterable columns
CREATE INDEX idx_posts_difficulty ON public.posts (difficulty);
CREATE INDEX idx_posts_is_vibe_coded ON public.posts (is_vibe_coded);
CREATE INDEX idx_posts_guide_type ON public.posts (guide_type);

-- ============================================
-- 2. guide_steps — structured tutorial steps
-- ============================================

CREATE TABLE public.guide_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  author_annotation text,
  suggested_prompt text,
  checkpoint_description text,
  checkpoint_media_url text,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_guide_steps_post_order ON public.guide_steps (post_id, "order");

ALTER TABLE public.guide_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_steps_select" ON public.guide_steps
  FOR SELECT USING (true);

CREATE POLICY "guide_steps_insert" ON public.guide_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "guide_steps_update" ON public.guide_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "guide_steps_delete" ON public.guide_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

-- ============================================
-- 3. guide_blocks — parsed message blocks
-- ============================================

CREATE TABLE public.guide_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('human','assistant')),
  content text NOT NULL,
  tool_action text,
  file_path text,
  original_order integer NOT NULL,
  auto_category text CHECK (auto_category IN ('scaffold','feature','bug_fix','refactor','question','file_change','command')),
  files_touched text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_guide_blocks_post_order ON public.guide_blocks (post_id, original_order);

ALTER TABLE public.guide_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_blocks_select" ON public.guide_blocks
  FOR SELECT USING (true);

CREATE POLICY "guide_blocks_insert" ON public.guide_blocks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "guide_blocks_update" ON public.guide_blocks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "guide_blocks_delete" ON public.guide_blocks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

-- ============================================
-- 4. step_blocks — junction: blocks placed in steps
-- ============================================

CREATE TABLE public.step_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id uuid NOT NULL REFERENCES public.guide_steps(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.guide_blocks(id) ON DELETE CASCADE,
  position integer NOT NULL,
  display_mode text DEFAULT 'full' NOT NULL CHECK (display_mode IN ('full','collapsed','trimmed','ghost')),
  author_note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_step_blocks_step_position ON public.step_blocks (step_id, position);

ALTER TABLE public.step_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "step_blocks_select" ON public.step_blocks
  FOR SELECT USING (true);

CREATE POLICY "step_blocks_insert" ON public.step_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guide_steps gs
      JOIN public.posts p ON p.id = gs.post_id
      WHERE gs.id = step_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "step_blocks_update" ON public.step_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.guide_steps gs
      JOIN public.posts p ON p.id = gs.post_id
      WHERE gs.id = step_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "step_blocks_delete" ON public.step_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.guide_steps gs
      JOIN public.posts p ON p.id = gs.post_id
      WHERE gs.id = step_id AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. guide_completions — reader completion tracking
-- ============================================

CREATE TABLE public.guide_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  review text,
  completed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_guide_completions_post ON public.guide_completions (post_id);
CREATE INDEX idx_guide_completions_user ON public.guide_completions (user_id);

ALTER TABLE public.guide_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_completions_select" ON public.guide_completions
  FOR SELECT USING (true);

CREATE POLICY "guide_completions_insert" ON public.guide_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guide_completions_update" ON public.guide_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "guide_completions_delete" ON public.guide_completions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. Triggers — completions_count + avg_rating
-- ============================================

CREATE OR REPLACE FUNCTION public.update_guide_completion_stats()
RETURNS trigger AS $$
BEGIN
  IF (tg_op = 'INSERT') THEN
    UPDATE public.posts SET
      completions_count = completions_count + 1,
      avg_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.guide_completions
        WHERE post_id = NEW.post_id AND rating IS NOT NULL
      )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (tg_op = 'DELETE') THEN
    UPDATE public.posts SET
      completions_count = GREATEST(completions_count - 1, 0),
      avg_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.guide_completions
        WHERE post_id = OLD.post_id AND rating IS NOT NULL
      )
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF (tg_op = 'UPDATE') THEN
    UPDATE public.posts SET
      avg_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.guide_completions
        WHERE post_id = NEW.post_id AND rating IS NOT NULL
      )
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_guide_completion_change
  AFTER INSERT OR UPDATE OR DELETE ON public.guide_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_guide_completion_stats();
