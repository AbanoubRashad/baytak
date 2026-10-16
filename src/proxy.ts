import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { hasSupabase, supabaseAnonKey, supabaseUrl } from './lib/supabase/env';

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The admin is English-only and outside language detection (no /ar/admin, no locale cookie redirects).
  if (/^\/(?:en|ar)\/admin(?:\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(`${pathname.replace(/^\/(?:en|ar)/, '')}${search}`, request.url));
  }
  const isAdmin = /^\/admin(?:\/|$)/.test(pathname);
  const response = isAdmin ? NextResponse.rewrite(new URL(`/en${pathname}${search}`, request.url)) : intl(request);

  // Keep Romany's admin session fresh (Supabase rotates its auth cookies).
  if (isAdmin && hasSupabase) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    await supabase.auth.getUser();
  }
  return response;
}

export const config = {
  // Everything except API routes, Next internals, Vercel internals and files with an extension.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
