import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { texts, target } = await req.json();

  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    typeof target !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Cap at 50 texts per request
  const batch = texts.slice(0, 50) as string[];

  try {
    const params = new URLSearchParams();
    params.set("client", "gtx");
    params.set("sl", "auto");
    params.set("tl", target);
    params.set("dt", "t");
    for (const text of batch) {
      params.append("q", text);
    }

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/t?${params.toString()}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Translation service error" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Response format: single text returns [translatedText, sourceLang]
    // Multiple texts returns [[translatedText, sourceLang], ...]
    let translated: string[];
    if (batch.length === 1) {
      translated = [Array.isArray(data[0]) ? data[0][0] : data[0]];
    } else {
      translated = data.map((item: string | string[]) =>
        Array.isArray(item) ? item[0] : item
      );
    }

    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
