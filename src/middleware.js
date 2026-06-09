// Refreshes the Supabase auth session on every /admin request and redirects
// unauthenticated users to the login page. Admin-identity (allowlist) is checked
// again server-side in the page + action; this middleware only gates presence of
// a session so unauthenticated users never see the review UI.
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith('/admin/login');
  if (pathname.startsWith('/admin') && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
