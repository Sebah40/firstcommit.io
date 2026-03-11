import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { ResumePdf } from "./resume-pdf";
import type { ResumeData } from "@/types";

/** Count PDF pages by scanning for /Type /Page objects in the buffer. */
function countPages(buf: Buffer): number {
  const str = buf.toString("latin1");
  const matches = str.match(/\/Type[\s\r\n]*\/Page[^s]/g);
  return matches ? matches.length : 1;
}

export interface GenerateResult {
  pdf_url: string;
  pages: number;
  max_pages: number;
  overflowed: boolean;
  overflow_pages: number;
}

export async function generateResumePdf(
  userId: string,
  resumeData: ResumeData,
  maxPages = 1
): Promise<GenerateResult> {
  const buf = await renderToBuffer(
    createElement(ResumePdf, { data: resumeData }) as ReactElement<DocumentProps>
  );
  const pages = countPages(buf);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const storagePath = `resumes/${userId}/resume.pdf`;
  await supabase.storage
    .from("post-media")
    .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });

  const { data: { publicUrl } } = supabase.storage
    .from("post-media")
    .getPublicUrl(storagePath);

  await supabase
    .from("profiles")
    .update({ resume_pdf_url: publicUrl })
    .eq("id", userId);

  return {
    pdf_url: publicUrl,
    pages,
    max_pages: maxPages,
    overflowed: pages > maxPages,
    overflow_pages: Math.max(0, pages - maxPages),
  };
}
