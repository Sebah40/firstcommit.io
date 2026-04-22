import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";
import { generateResumePdf, type ResumeLocale } from "../src/lib/resume/generate-pdf";
import type { ResumeData } from "../src/types";

async function main() {
  const username = process.argv[2];
  const localeArg = process.argv[3] ?? "en";
  if (!username || (localeArg !== "en" && localeArg !== "es")) {
    console.error("Usage: tsx scripts/rebuild-resume-pdf.ts <username> [en|es]");
    process.exit(1);
  }
  const locale = localeArg as ResumeLocale;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const dataCol = locale === "en" ? "resume_data" : "resume_data_es";
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`id, ${dataCol}, resume_max_pages`)
    .eq("username", username)
    .single();

  if (error || !profile) {
    console.error("Profile not found:", error);
    process.exit(1);
  }
  const resumeData = (profile as Record<string, unknown>)[dataCol] as ResumeData | null;
  if (!resumeData) {
    console.error(`No ${dataCol} found for ${username}.`);
    process.exit(1);
  }

  const result = await generateResumePdf(
    (profile as { id: string }).id,
    resumeData,
    (profile as { resume_max_pages?: number }).resume_max_pages ?? 1,
    locale
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
