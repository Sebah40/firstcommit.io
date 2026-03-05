export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return new Response(
    JSON.stringify({
      issuer: origin,
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/api/mcp/oauth/token`,
      registration_endpoint: `${origin}/api/mcp/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
