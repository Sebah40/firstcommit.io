/**
 * Translate a string to English using Google Translate.
 * Returns the original text on failure.
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) return text;

  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: "en",
      dt: "t",
      q: text,
    });

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/t?${params.toString()}`
    );

    if (!res.ok) return text;

    const data = await res.json();
    // Response: [translatedText, detectedLang]
    const translated = Array.isArray(data[0]) ? data[0][0] : data[0];
    return typeof translated === "string" ? translated : text;
  } catch {
    return text;
  }
}
