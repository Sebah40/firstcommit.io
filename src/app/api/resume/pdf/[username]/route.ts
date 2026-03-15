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

    const res = await fetch(profile.resume_pdf_url);
    if (!res.ok) {
      return NextResponse.json({ error: "PDF unavailable", upstream: res.status }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[resume/pdf] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
