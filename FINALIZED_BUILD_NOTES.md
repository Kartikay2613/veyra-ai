# Veyra AI — Final Production Build

This package is finalized around one consistent account/authentication contract.

## Authentication
- Google OAuth via `/auth/callback`.
- Email/password signup and login.
- Password reset and authenticated password change.
- Every successful login method lands on `/dashboard`.
- Logged-in visitors opening `/auth` are sent to `/dashboard`.
- Protected Learning OS routes are enforced by the Next.js proxy and server app layout.

## Account center
The profile button is the authenticated account entry point and exposes:
- Account settings
- Privacy & delete account
- Light theme
- Dark theme
- Sign out

The settings page contains:
- Display name + read-only account email
- Light/dark appearance controls
- Password update
- Learning profile rebuild
- Privacy/terms links
- Support contact + support center
- Sign out
- Permanent account deletion flow

## Theme contract
- Public website: dark-first.
- New accounts: dark by default.
- Authenticated users: light or dark from Account Settings/profile menu.
- Preference persisted in `profiles.theme`.
- Preference mirrored in `veyra-theme` cookie for server-rendered restoration.
- Sign out returns the public experience to dark.
- Server HTML uses the saved cookie theme, preventing a normal refresh theme flash.

## Database
`supabase/final_learning_schema.sql` now creates/repairs the account `profiles` table, enables RLS, validates the theme value, and creates a trigger that inserts a dark-default profile for new email/Google accounts.

## Vercel
`vercel.json` pins the project to the normal Next.js install/build commands. Production environment variables and Google callback configuration are documented in `DEPLOYMENT_CHECKLIST.md`.

## Important
The application code cannot enable Google OAuth or create Vercel/Supabase secrets automatically. Those values must be configured in the Supabase and Vercel dashboards using the included deployment checklist.
