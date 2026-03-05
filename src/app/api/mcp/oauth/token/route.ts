import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { SignJWT } from "jose";

const TOKEN_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const TOKEN_TTL = "30d";

async function mintToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .setIssuer("firstcommit")
    .sign(TOKEN_SECRET);
}

export async function POST(req: Request) {
  const body = await req.formData().catch(() => null);
  const params = body
    ? Object.fromEntries(body.entries())
    : await req.json();

  const grantType = params.grant_type;

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(params);
  }

  if (grantType === "refresh_token") {
    return handleRefreshToken(params);
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400 }
  );
}

async function handleAuthorizationCode(params: Record<string, any>) {
  const { code, code_verifier, redirect_uri } = params;

  if (!code || !code_verifier) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authCode } = await supabase
    .from("mcp_auth_codes")
    .select("*")
    .eq("code", code)
    .eq("used", false)
    .single();

  if (!authCode) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  if (new Date(authCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  if (redirect_uri && authCode.redirect_uri !== redirect_uri) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  const challenge = base64urlEncode(
    createHash("sha256").update(code_verifier).digest()
  );

  if (challenge !== authCode.code_challenge) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  await supabase
    .from("mcp_auth_codes")
    .update({ used: true })
    .eq("code", code);

  // Mint a long-lived First Commit token instead of passing through the Supabase JWT
  const pathwayToken = await mintToken(authCode.user_id);

  return NextResponse.json({
    access_token: pathwayToken,
    token_type: "Bearer",
    expires_in: 30 * 24 * 3600, // 30 days
  });
}

async function handleRefreshToken(params: Record<string, any>) {
  const { refresh_token } = params;

  if (!refresh_token) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // refresh_token IS a First Commit token — just verify and re-mint
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(refresh_token, TOKEN_SECRET, {
      issuer: "firstcommit",
    });
    const newToken = await mintToken(payload.sub!);
    return NextResponse.json({
      access_token: newToken,
      token_type: "Bearer",
      expires_in: 30 * 24 * 3600,
    });
  } catch {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }
}

function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
