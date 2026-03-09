ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_data jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_style_instructions text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_updated_at timestamptz;
