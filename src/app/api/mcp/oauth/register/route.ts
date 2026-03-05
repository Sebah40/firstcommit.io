import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  const redirectUris: string[] = body.redirect_uris;
  const clientName: string | undefined = body.client_name;

  if (!redirectUris?.length) {
    return NextResponse.json(
      { error: "redirect_uris is required" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("mcp_oauth_clients")
    .insert({ redirect_uris: redirectUris, client_name: clientName })
    .select("client_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    client_id: data.client_id,
    redirect_uris: redirectUris,
    client_name: clientName,
    token_endpoint_auth_method: "none",
  }, { status: 201 });
}
