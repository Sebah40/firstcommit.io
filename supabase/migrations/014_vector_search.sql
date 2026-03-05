-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Add embedding column (1536 dims = OpenAI text-embedding-3-small / ada-002)
ALTER TABLE progress_logs
  ADD COLUMN embedding vector(1536);

-- 3. HNSW index for fast cosine similarity search
CREATE INDEX idx_progress_logs_embedding
  ON progress_logs
  USING hnsw (embedding vector_cosine_ops);

-- 4. Similarity search function
CREATE OR REPLACE FUNCTION match_progress_logs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  project_name text,
  feature text,
  what_was_built text,
  key_decisions text[],
  problems_hit text[],
  files_changed text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pl.id,
    pl.user_id,
    pl.project_name,
    pl.feature,
    pl.what_was_built,
    pl.key_decisions,
    pl.problems_hit,
    pl.files_changed,
    1 - (pl.embedding <=> query_embedding) AS similarity
  FROM progress_logs pl
  WHERE pl.embedding IS NOT NULL
    AND 1 - (pl.embedding <=> query_embedding) > match_threshold
  ORDER BY pl.embedding <=> query_embedding
  LIMIT match_count;
$$;
