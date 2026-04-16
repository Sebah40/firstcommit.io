import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Body must be JSON" },
        { status: 400 }
      );
    }

    const redirectUris: string[] | undefined = body.redirect_uris;
    const clientName: string | undefined = body.client_name;

    if (!redirectUris?.length) {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: "redirect_uris is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("[oauth/register] Missing Supabase env vars", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json(
        { error: "server_error", error_description: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("mcp_oauth_clients")
      .insert({ redirect_uris: redirectUris, client_name: clientName })
      .select("client_id")
      .single();

    if (error) {
      console.error("[oauth/register] Supabase insert failed", error);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        client_id: data.client_id,
        redirect_uris: redirectUris,
        client_name: clientName,
        token_endpoint_auth_method: "none",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[oauth/register] Uncaught exception", err);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
