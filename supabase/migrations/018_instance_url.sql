-- Add instance_url to posts for linking to the live deployed project
ALTER TABLE public.posts ADD COLUMN instance_url text;
