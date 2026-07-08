import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely — only ever use this for
 * operations that must run with elevated privilege (e.g. inviteUserByEmail).
 * Never import this into client components or expose SUPABASE_SERVICE_ROLE_KEY
 * with a NEXT_PUBLIC_ prefix.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
