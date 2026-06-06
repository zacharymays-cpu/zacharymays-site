// Service-role Supabase client — SERVER ONLY. Bypasses RLS, so it must never be
// imported into a Client Component or shipped to the browser. Used by the review
// Server Action to call the record_criterion_change RPC after the caller has been
// verified as an admin. Reads the key from SUPABASE_SERVICE_ROLE_KEY (a Vercel
// env var / .env.local — never hardcoded, never NEXT_PUBLIC_).
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!SERVICE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — required for admin writes.',
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
