Veyra AI — Personalized Learning OS

Veyra AI is an AI-powered Personalized Learning Path Recommender. It turns a learner's goal, experience, interests, current skills, learning style, available time and learning history into a prerequisite-aware roadmap of resources, projects and assessments.

## Core experience

- Natural-language learner onboarding and profiling
- AI-generated 6–8 step learning roadmap
- Skill-gap and prerequisite reasoning
- Course / project / assessment resource recommendations
- Path progress and milestone tracking
- Adaptive diagnostic that feeds new evidence back into the path
- Path-aware AI Coach
- Persistent learner profile and learning goals in Supabase
- Light / dark theme with persisted preference
- Email authentication + Google OAuth
- Profile menu with theme control, sign out and goal/path deletion
- Responsive premium Learning OS UI

## Run locally

```bash
npm install
npm run dev
```

For local development only, run `npm run dev` and open `http://localhost:3000`. Production OAuth uses the current Vercel/site origin automatically; localhost is never used as the production callback.

Copy `.env.example` to `.env.local` and provide the Supabase and Groq values.

## Supabase

Run `supabase/final_learning_schema.sql` against the project that contains the `learning_*` tables. The current application uses the canonical tables:

- `learner_profiles`
- `learning_goals`
- `learning_paths`
- `learning_path_items`
- `learning_progress`
- `learning_resources`
- `skills`
- `user_skills`
- `profiles`

The `learning_resources.resource_type` value is normalized to the database's lowercase allowed values (`course`, `video`, `article`, `book`, `project`, `assessment`, `documentation`).

## Google login

In Supabase Auth, enable the Google provider and add the application's callback URL:

`https://YOUR-PRODUCTION-DOMAIN/auth/callback` (use your actual Vercel production domain)

For production, add the equivalent production callback URL. The app uses the browser OAuth flow and exchanges the callback code server-side.

## AI model

Learning-path generation uses the configured Groq model `openai/gpt-oss-120b`. The coach/reflection layer uses `openai/gpt-oss-20b`.

Never commit real API keys to the repository.
