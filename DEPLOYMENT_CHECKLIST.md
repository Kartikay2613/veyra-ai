# Veyra AI — Production Deployment Checklist

## Vercel environment variables
Set these for **Production**, **Preview**, and **Development** as needed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never prefix with `NEXT_PUBLIC_`
- `GROQ_API_KEY_1`
- `OPENAI_API_KEY` if any enabled route requires it
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_SUPPORT_PHONE` (optional)

## Supabase database
Run `supabase/final_learning_schema.sql` once in the Supabase SQL Editor. The migration:

- creates/repairs the private `profiles` account table;
- stores `theme` as `dark` or `light`;
- enables row-level security for account rows;
- creates the account row automatically for new email/Google users;
- keeps the existing learning tables protected by user ID.

## Google authentication
In Supabase Authentication → Providers → Google, enable Google and configure the Google OAuth client.

Add this callback URL to the Supabase/Google OAuth configuration:

`https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`

Also set the Supabase **Site URL** to the production Vercel domain. Add your preview/local callback URLs only if you intentionally use them.

## Expected authentication flow

1. Public website opens dark-first.
2. Email signup/login and Google login both end at `/dashboard`.
3. All Learning OS routes are protected by the Next.js proxy and server app layout.
4. The profile button opens Account Settings, Privacy & Delete Account, Light Theme, Dark Theme, and Sign Out.
5. Theme is saved in `profiles.theme` and mirrored into the `veyra-theme` cookie.
6. Refreshing the page restores the saved theme before React hydrates.
7. Signing out clears the authenticated state and returns the public site to dark mode.
8. Account deletion requires confirmation and uses the Supabase service role only on the server.
