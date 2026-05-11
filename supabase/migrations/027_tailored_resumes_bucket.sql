-- Private bucket for one-shot tailored resume PDFs (24h TTL).
-- Files are accessed via signed URLs; bucket stays private so signed URLs are meaningful.
insert into storage.buckets (id, name, public)
values ('tailored-resumes', 'tailored-resumes', false)
on conflict (id) do nothing;

-- Service role bypasses RLS; no public read/write policies needed.
-- Cleanup is handled by the /api/cron/cleanup-tailored route (24h retention).
