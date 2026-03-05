-- OAuth clients (dynamic registration from Claude Code)
CREATE TABLE mcp_oauth_clients (
  client_id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  redirect_uris text[] NOT NULL,
  client_name text,
  created_at timestamptz DEFAULT now()
);

-- Short-lived auth codes for OAuth exchange
CREATE TABLE mcp_auth_codes (
  code text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id text NOT NULL REFERENCES mcp_oauth_clients(client_id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  code_challenge_method text DEFAULT 'S256',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false
);

-- Index for cleanup
CREATE INDEX idx_mcp_auth_codes_expires ON mcp_auth_codes(expires_at);

-- RLS: these are only accessed by API routes (service-level), not client-side
ALTER TABLE mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_auth_codes ENABLE ROW LEVEL SECURITY;
