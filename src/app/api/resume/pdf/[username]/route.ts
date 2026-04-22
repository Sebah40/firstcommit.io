import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
    }

    const supabase = getServiceClient();
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("resume_pdf_url")
      .eq("username", username)
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!profile?.resume_pdf_url) {
      return NextResponse.json({ error: "No PDF found" }, { status: 404 });
    }

    console.log("[resume/pdf]", username, "url:", profile.resume_pdf_url);

    const res = await fetch(profile.resume_pdf_url);
    console.log("[resume/pdf]", username, "upstream:", res.status, "size:", res.headers.get("content-length"), "type:", res.headers.get("content-type"));

    if (!res.ok) {
      return NextResponse.json({ error: "PDF unavailable", upstream: res.status }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    console.log("[resume/pdf]", username, "buffer:", buf.byteLength, "bytes");

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Content-Security-Policy": "frame-ancestors 'self'; navigate-to 'none'",
      },
    });
  } catch (err) {
    console.error("[resume/pdf] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
