import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\n/g, " ").trim();
  if (!input) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const response = await getClient().embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0].embedding;
}
