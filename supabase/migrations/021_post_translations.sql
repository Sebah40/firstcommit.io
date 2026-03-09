-- Cached translations for posts (server-written only, client read-only)
CREATE TABLE public.post_translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('es')),
  title text NOT NULL,
  hook_description text NOT NULL DEFAULT '',
  content text,
  stages_json jsonb,
  source_updated_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, locale)
);

CREATE INDEX idx_post_translations_post_locale
  ON public.post_translations (post_id, locale);

ALTER TABLE public.post_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations
CREATE POLICY "post_translations_select" ON public.post_translations
  FOR SELECT USING (true);

-- No insert/update/delete policies — writes only via service_role (bypasses RLS)
