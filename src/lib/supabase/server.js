// Server-side Supabase client (cookie-bound session) for the App Router.
// Used in Server Components, Route Handlers, and Server Actions to read the
// signed-in user's session. Public URL + anon key only — never the service key.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll is called from a Server Component — safe to ignore; the
          // middleware refreshes the session cookie on the response.
        }
      },
    },
  });
}
