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
  const { username } = await params;

  const supabase = getServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_pdf_url")
    .eq("username", username)
    .single();

  if (!profile?.resume_pdf_url) {
    return NextResponse.json({ error: "No PDF found" }, { status: 404 });
  }

  const res = await fetch(profile.resume_pdf_url);
  if (!res.ok) {
    return NextResponse.json({ error: "PDF unavailable" }, { status: 502 });
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
