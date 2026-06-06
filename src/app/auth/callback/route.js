// OAuth callback: exchanges the provider code for a Supabase session cookie,
// then redirects into the app. Configure this URL as the redirect in both the
// Supabase Auth settings and the GitHub OAuth app:
//   https://<your-domain>/auth/callback
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/admin/review';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/admin/login?error=auth`);
}
