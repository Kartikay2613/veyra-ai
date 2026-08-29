import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { generateAnonUsername } from "@/app/lib/anonUsername";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();

  if (!code) {
    return NextResponse.redirect(new URL("/auth?mode=login&error=missing_code", request.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/auth?mode=login&error=oauth_failed", request.url));
  }

  const user = data.user;
  const { data: existingProfile, error: profileReadError } = await supabase
    .from("profiles")
    .select("id,name,theme,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) console.error("Profile lookup after OAuth failed:", profileReadError);

  const displayName =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    generateAnonUsername();

  let resolvedTheme: "light" | "dark" = existingProfile?.theme === "light" ? "light" : "dark";

  if (!existingProfile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      name: displayName,
      theme: "dark",
    });
    if (profileError) console.error("Failed to create OAuth profile:", profileError);
    resolvedTheme = "dark";
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("veyra-theme", resolvedTheme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
