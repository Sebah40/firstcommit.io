import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const lang = req.nextUrl.searchParams.get("lang") === "es" ? "es" : "en";

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

    const pdfUrl = lang === "es"
      ? profile.resume_pdf_url.replace(/\/resume\.pdf(\?|$)/, "/resume-es.pdf$1")
      : profile.resume_pdf_url;

    console.log("[resume/pdf]", username, "lang:", lang, "url:", pdfUrl);

    const res = await fetch(pdfUrl);
    console.log("[resume/pdf]", username, "upstream:", res.status, "size:", res.headers.get("content-length"), "type:", res.headers.get("content-type"));

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "PDF unavailable", upstream: res.status }, { status: 502 });
    }

    return new Response(res.body, {
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
