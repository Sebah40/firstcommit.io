-- 010_simplify_pivot.sql
-- Strip guide builder tables, add simplified post metadata columns

-- Drop tables no longer needed (order matters for FK constraints)
DROP TABLE IF EXISTS step_blocks CASCADE;
DROP TABLE IF EXISTS guide_steps CASCADE;
DROP TABLE IF EXISTS guide_blocks CASCADE;
DROP TABLE IF EXISTS message_annotations CASCADE;
DROP TABLE IF EXISTS timeline_chapters CASCADE;

-- Drop stars_count column from posts
ALTER TABLE posts DROP COLUMN IF EXISTS stars_count;

-- Add new columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS files_changed integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS highlight_snippet text;

-- Keep message_stars table — repurposed for AI-selected highlights
