import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Single server-side Supabase session boundary.
 *
 * We intentionally do NOT redirect authenticated users away from /auth here.
 * The browser can briefly know about a newly-created session before the SSR
 * cookies are visible to middleware; redirecting /auth from middleware during
 * that window was the source of the Vercel redirect loop.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) console.warn("Supabase middleware auth check:", error.message);

  const pathname = request.nextUrl.pathname;
  const protectedPrefixes = [
    "/dashboard", "/today", "/path", "/skills", "/resources", "/coach",
    "/assessment", "/calendar", "/leaderboard", "/goals", "/settings",
    "/onboarding", "/delete-account",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!user) {
    response.cookies.set("veyra-theme", "dark", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("mode", "login");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Never perform the reverse redirect here. AuthPage/AuthContext owns the
  // client-side post-login navigation, preventing /auth <-> /dashboard loops.
  return response;
}
