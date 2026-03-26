-- Add repo_url to posts (source code repo, distinct from instance_url which is the live demo)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repo_url text;
