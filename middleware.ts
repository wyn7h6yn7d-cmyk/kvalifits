import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { getSupabaseAnonKey, getSupabaseUrl } from "./lib/supabase/env";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * next-intl routing + Supabase session refresh.
 * Expired/refreshable sessions are renewed on matched navigations so server
 * components see a current JWT (getUser validates signature/expiry).
 */
export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  try {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    if (!url || !key) return response;

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Touches/refreshes the auth session when needed (does not trust getSession alone).
    await supabase.auth.getUser();
  } catch {
    // Never block locale routing if session refresh fails.
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
