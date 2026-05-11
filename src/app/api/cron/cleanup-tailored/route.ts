import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "tailored-resumes";
const TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = Date.now() - TTL_MS;
  const toDelete: string[] = [];

  const { data: userDirs, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  for (const dir of userDirs ?? []) {
    if (!dir.name) continue;
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(dir.name, { limit: 1000 });
    for (const f of files ?? []) {
      if (!f.name) continue;
      const stamp = parseInt(f.name.split("-")[0], 10);
      if (Number.isFinite(stamp) && stamp < cutoff) {
        toDelete.push(`${dir.name}/${f.name}`);
      }
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const { error: delErr } = await supabase.storage.from(BUCKET).remove(toDelete);
  if (delErr) {
    return NextResponse.json({ error: delErr.message, attempted: toDelete.length }, { status: 500 });
  }

  return NextResponse.json({ deleted: toDelete.length, paths: toDelete });
}
