import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";
import { generateResumePdf } from "../src/lib/resume/generate-pdf";
import type { ResumeData } from "../src/types";

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: tsx scripts/rebuild-resume-pdf.ts <username>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, resume_data, resume_max_pages")
    .eq("username", username)
    .single();

  if (error || !profile?.resume_data) {
    console.error("Profile not found or no resume_data:", error);
    process.exit(1);
  }

  const result = await generateResumePdf(
    profile.id,
    profile.resume_data as ResumeData,
    profile.resume_max_pages ?? 1
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
