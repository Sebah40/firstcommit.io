-- Add markdown content field for narrative posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content text;
