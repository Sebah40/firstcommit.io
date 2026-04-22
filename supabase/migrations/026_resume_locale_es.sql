ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS resume_data_es JSONB,
  ADD COLUMN IF NOT EXISTS resume_pdf_url_es TEXT;
