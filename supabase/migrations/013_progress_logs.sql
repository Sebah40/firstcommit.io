-- Progress logs: incremental build entries that survive context compaction
CREATE TABLE progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  feature text NOT NULL,
  what_was_built text NOT NULL,
  key_decisions text[] DEFAULT '{}',
  problems_hit text[] DEFAULT '{}',
  files_changed text[] DEFAULT '{}',
  commit_message text NOT NULL,
  commit_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_progress_logs_user_project
  ON progress_logs(user_id, project_name, created_at);

-- RLS: users can only access their own logs
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own logs"
  ON progress_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own logs"
  ON progress_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON progress_logs FOR DELETE USING (auth.uid() = user_id);
