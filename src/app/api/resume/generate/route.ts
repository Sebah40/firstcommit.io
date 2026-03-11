import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateResumePdf } from "@/lib/resume/generate-pdf";
import type { ResumeData } from "@/types";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_data, resume_max_pages")
    .eq("id", user.id)
    .single();

  if (!profile?.resume_data) {
    return NextResponse.json({ error: "No resume data found" }, { status: 404 });
  }

  const result = await generateResumePdf(
    user.id,
    profile.resume_data as ResumeData,
    profile.resume_max_pages ?? 1
  );

  return NextResponse.json(result);
}
