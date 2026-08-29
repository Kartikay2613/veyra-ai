# Veyra AI — Final Production Build

This build is the consolidated SaaS release. It is intentionally a complete project replacement rather than a patch set.

## Product capabilities

- Dark-first public marketing site.
- Google OAuth and email/password authentication.
- One post-auth destination: `/dashboard`.
- Protected Learning OS routes.
- Desktop + mobile account menu.
- Account settings with profile, password, privacy/delete flow and theme controls.
- Light/dark theme persistence through Supabase + cookie/local cache.
- Theme restoration without a dark/light hydration flash.
- Vercel-safe OAuth callback based on `window.location.origin` / current request origin; no production localhost callback.
- Master dashboard with current path, next-best-action, progress, XP, level, theme control and account controls.
- Multiple independent learning paths.
- Dedicated path/course dashboard at `/path/[id]`.
- Adaptive diagnostic/assessment.
- Skills/resources/calendar/leaderboard sections.
- XP for learning milestone completion and assessment completion, plus a one-time full-path bonus.
- Idempotent XP RPC to prevent duplicate awards when a completion request retries.
- AI Coach with real Groq generation, recent conversation context, learner/path context, local chat persistence and a readable light/dark composer.
- AI Coach no longer falls back to the same canned answer for every question.
- Faster perceived navigation: auth shell opens as soon as the browser session is restored; profile/theme data hydrates in parallel.
- Desktop profile dropdown rendered in a portal to avoid navbar clipping/z-index issues.
- Responsive mobile behavior.

## Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required by account deletion/server administration flows if used by your deployment)
- `GROQ_API_KEY_1` (or `GROQ_API_KEY`)
- `OPENAI_API_KEY` if any OpenAI-backed feature is enabled in your environment
- Optional: `GROQ_CHAT_MODEL=openai/gpt-oss-20b`

## Supabase setup

Run `supabase/final_learning_schema.sql` in the Supabase SQL Editor before testing XP. It creates the account profile/theme storage, profile trigger and idempotent XP RPC.

## OAuth setup

In Supabase Authentication URL Configuration, add the production callback:

`https://YOUR-VERCEL-DOMAIN/auth/callback`

Also add the exact production site URL to the allowed redirect URLs.

## Local verification

```bash
npm ci
npm run build
npm run start
```

## Deployment

Push the complete project to the connected GitHub `main` branch. Vercel is configured to use `npm ci` and `npm run build`.
