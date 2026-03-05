-- Add cv_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url text;
