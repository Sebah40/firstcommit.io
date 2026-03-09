import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF file required" },
        { status: 400 }
      );
    }

    // Extract raw text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const result = await parser.getText();
    const rawText = result.text;

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from PDF. The file may be image-based." },
        { status: 422 }
      );
    }

    // Store raw text in resume_data as a starting point
    // The user's AI agent will structure this via MCP tools
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        resume_data: { _raw_text: rawText, basics: { name: "" }, education: [], work: [], skills: [] },
        resume_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to save: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ raw_text_length: rawText.length });
  } catch (err: any) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
