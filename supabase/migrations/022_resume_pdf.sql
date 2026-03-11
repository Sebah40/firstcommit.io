-- Add server-generated PDF storage and page limit to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resume_pdf_url  text,
  ADD COLUMN IF NOT EXISTS resume_max_pages integer NOT NULL DEFAULT 1;
