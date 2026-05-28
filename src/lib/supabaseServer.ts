import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Service-role client for server-side trusted writes that need to bypass RLS.
 *
 * Use this only inside API routes that already have their own validation /
 * spam gates / rate limits — the service role bypasses every row-level
 * policy on the database, so any caller that reaches this client effectively
 * has unrestricted DB access. NEVER expose this client (or the key) to the
 * browser. The key must be set as SUPABASE_SERVICE_ROLE_KEY (without the
 * NEXT_PUBLIC_ prefix) so Next.js never bundles it into client code.
 */
export function supabaseServerRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing service-role Supabase env vars — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
