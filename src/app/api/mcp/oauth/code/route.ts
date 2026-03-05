import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    access_token,
    refresh_token,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
  } = body;

  if (!access_token || !client_id || !redirect_uri || !code_challenge) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the access token to get user ID
  const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Verify client_id and redirect_uri
  const { data: client } = await supabase
    .from("mcp_oauth_clients")
    .select("redirect_uris")
    .eq("client_id", client_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Unknown client_id" }, { status: 400 });
  }

  if (!client.redirect_uris.includes(redirect_uri)) {
    return NextResponse.json({ error: "redirect_uri not registered" }, { status: 400 });
  }

  // Create auth code
  const { data: codeRow, error } = await supabase
    .from("mcp_auth_codes")
    .insert({
      client_id,
      user_id: user.id,
      redirect_uri,
      code_challenge,
      code_challenge_method: code_challenge_method || "S256",
      access_token,
      refresh_token,
    })
    .select("code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: codeRow.code });
}
