import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { ResumePdf } from "./resume-pdf";
import type { ResumeData } from "@/types";

const BUCKET = "tailored-resumes";
const TTL_SECONDS = 60 * 60 * 24; // 24h

export interface TailoredResult {
  signed_url: string;
  expires_at: string;
  storage_path: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function generateTailoredResumePdf(opts: {
  userId: string;
  resumeData: ResumeData;
  jobTitle?: string;
  jobCompany?: string;
}): Promise<TailoredResult> {
  const { userId, resumeData, jobTitle, jobCompany } = opts;

  const buf = await renderToBuffer(
    createElement(ResumePdf, { data: resumeData }) as ReactElement<DocumentProps>
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stamp = Date.now();
  const slug =
    [jobCompany, jobTitle]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .map(slugify)
      .filter(Boolean)
      .join("-") || "tailored";
  const storagePath = `${userId}/${stamp}-${slug}.pdf`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, TTL_SECONDS, {
      download: `resume-${slug}.pdf`,
    });
  if (signErr || !signed) throw new Error(`sign failed: ${signErr?.message ?? "unknown"}`);

  return {
    signed_url: signed.signedUrl,
    expires_at: new Date(Date.now() + TTL_SECONDS * 1000).toISOString(),
    storage_path: storagePath,
  };
}
