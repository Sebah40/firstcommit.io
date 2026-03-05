import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user from either:
 * 1. Bearer token → Supabase JWT (from MCP OAuth flow)
 * 2. Session cookie → Supabase auth (from web)
 *
 * Returns userId and a supabase client scoped to that user.
 */
export async function resolveUser(request: NextRequest): Promise<{
  userId: string | null;
  supabase: SupabaseClient;
}> {
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");

  if (bearer) {
    // Create a Supabase client with the user's JWT — RLS works automatically
    const supabase = createDirectClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearer}` } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser(bearer);
    if (error || !user) {
      return { userId: null, supabase };
    }

    return { userId: user.id, supabase };
  }

  // Fall back to session cookie auth (web)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}
