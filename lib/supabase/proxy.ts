import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pendingCookies = new Map<string, Parameters<typeof response.cookies.set>[2]>();
  // Always use a request-local client. Forward both refreshed request cookies
  // and response cookies; retain cache headers even if setAll runs twice.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        const previous = response.cookies.getAll();
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          pendingCookies.set(name, options);
        }
        response = NextResponse.next({ request });
        for (const cookie of previous) response.cookies.set(cookie);
        for (const { name, value } of cookiesToSet) response.cookies.set(name, value, pendingCookies.get(name));
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    } },
  );
  const { data, error } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublic = path === "/sign-in" || path === "/sign-up" || path.startsWith("/auth/");
  if (!isPublic && !path.startsWith("/api/") && (error || !data?.claims.sub)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", path + request.nextUrl.search);
    const redirected = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirected.cookies.set(cookie);
    response = redirected;
  }
  // Personal responses and auth cookie updates must never be shared by a CDN.
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
