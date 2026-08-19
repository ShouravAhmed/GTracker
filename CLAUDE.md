# GTracker — GAMAM Interview Tracker

A Next.js app for tracking progress through **150 days of GAMAM** (Google, Amazon, Microsoft, Apple, Meta) technical-interview problems. Users sign in with Google (via Supabase), start "modules", mark problems solved, log focus time (Pomodoro), and keep per-problem notes. Deployed on Netlify at https://gamam-tracker.netlify.app.

> Note: `README.md` and `SUPABASE_SETUP.md` are partly **outdated** (they reference a `user_solves`-only schema and a `001_create_user_solves.sql` file that no longer exists). Trust this file and the actual code/migration over those docs.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) — `package.json` says "Next.js 14" in README but it's actually 16.1.1
- **React 19**, **TypeScript** (strict)
- **Tailwind CSS 3** (mobile-first, dark mode via `ThemeProvider`/`class`)
- **@tanstack/react-query v5** — all client-side data fetching/mutation
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — auth (Google OAuth) + Postgres
- **framer-motion**, **lucide-react**
- Node >= 20 (`.nvmrc`, Netlify uses NODE_VERSION 20)

## Commands

- `npm run dev` — dev server (Turbopack). Falls back to port 3001 if 3000 is taken.
- `npm run build` / `npm start`
- `npm run lint`
- `npm run migrate` — runs `supabase/migrations/001_initial_schema.sql` via a direct `pg` connection. **DESTRUCTIVE: the migration `DROP`s all tables `CASCADE`.** Needs `DATABASE_URL` or `SUPABASE_DB_PASSWORD`.
- `npm run upload-150day-problems` — seeds the `150DayProblems` table from `src/assets/json/gamam150.json`. Needs `SUPABASE_SERVICE_ROLE_KEY`. Idempotent (upserts on `name,url,type`).

## Environment (`.env`, gitignored)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client + server Supabase.
- `NEXT_PUBLIC_SITE_URL` — used for OAuth `redirectTo` (`lib/solves-client.ts`, `components/Navbar.tsx`) and SEO `metadataBase` (`app/layout.tsx`). Must be the full deployed URL with no line breaks, or Google login redirects to `localhost`. Production value is set in Netlify's build env, not this file.
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**, only for the seed script. Bypasses RLS. `.env` is now gitignored to keep this out of git.

## Database Schema (`supabase/migrations/001_initial_schema.sql`)

- **`"150DayProblems"`** (quoted, starts with a digit) — the problem catalog. Cols: `id` (uuid), `name`, `url`, `difficulty`, `day` (int, nullable — null = "Day 127-150" bucket), `type`. Unique `(name, url, type)`. RLS: everyone can `SELECT`. ~666 rows across 6 types: Coding (567), Behavioral (29), System Design (28), Object Oriented Design (16), Schema Design (16), API Design (10).
- **`user_solves`** — per-user, per-problem state. `solved` (bool), `note`, `started_at`, `solved_at`, `focus_time` (seconds), unique `(user_id, problem_id)`. RLS: owner-only CRUD. `updated_at` trigger.
- **`user_module_starts`** — tracks which modules a user started + `current_day`. `module_type` is `'all'` for the GAMAM-150 module or the category name (`'Coding'`, `'System Design'`, …). Unique `(user_id, module_type)`.
- **`problem_solve_counts`** (view) — solve count per problem (for social-proof "N solved" badges).

Problem "state machine" (see `lib/supabase/solves.ts`): not-started → in-progress (`started_at` set, `solved=false`) → solved (`solved_at` set, `solved=true`). Multiple problems can be in-progress at once; toggling one doesn't affect others.

## Architecture

- **Server Actions** in `lib/supabase/solves.ts` (`'use server'`) — the canonical read/write layer against Supabase (`getAllProblems`, `getUserSolves`, `toggleProblemStatus`, `startProblem`, `updateFocusTime`, `updateProblemNote`, `startModule`, `getModuleProgress`, etc.). All `revalidatePath` after writes.
- **Client hook `useSolves()`** in `lib/solves-client.ts` — the app's main data source for client components. Uses React Query to read/mutate directly via the browser Supabase client (`lib/supabase/client.ts`), and handles Google OAuth sign-in and the localStorage-fallback path for logged-out users.
- **`proxy.ts`** (Next middleware, named `proxy`) → `lib/supabase/middleware.ts#updateSession` — refreshes the Supabase auth session cookie on every non-static request.
- **Pages** (`app/*/page.tsx`) are thin: category pages render `<GamamCategory categoryName=... />`; `/gamam-150` renders `<Gamam150 />`; `/` (`app/page.tsx`, client) renders `materialSets` → `MaterialSetSection` cards.
- **`components/GamamCategory.tsx`** (~780 lines) and **`components/Gamam150.tsx`** (~1600 lines) are the big feature components (problem lists, per-problem Pomodoro timer, inline notes, day grouping).
- **`lib/material-sets.ts`** — static config of the home-page module cards (routes, colors, `type`).
- **Auth callback**: `app/auth/callback/route.ts` exchanges the OAuth `code` for a session.

## Category naming gotcha

Three different representations of the same categories exist — be careful when touching data flow:
- **DB `type`** and **`module_type`**: human strings with spaces — `"System Design"`, `"Object Oriented Design"`, `"Schema Design"`, `"API Design"`, `"Coding"`, `"Behavioral"`.
- **`types/gamam.ts` `CategoryName`** / `GamamData` keys: camelCase — `SystemDesign`, `ObjectOrientedDesign`, `APIDesign`.
- **Seed JSON top-level keys** (`src/assets/json/gamam150.json`): mixed — `"Coding"`, `"System Design"`, `"Object Oriented Design"`, … (spaces).
- The current `upload-150day-problems.js` maps camelCase JSON keys → spaced `type`. **The recovered seed JSON uses spaced keys, so it does NOT match the script's expected camelCase keys** — if you ever re-run the seed, reconcile the key casing first (or the script will only import Coding + Behavioral).

## Deployment

Netlify (`netlify.toml`, `@netlify/plugin-nextjs`). `build = npm run build`, `publish = .next`, NODE_VERSION 20. Env vars (Supabase URL/anon key, `NEXT_PUBLIC_SITE_URL`) are configured in the Netlify dashboard. Google OAuth setup is in `GOOGLE_OAUTH_SETUP.md` (redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback`).

## Operational notes

- **Supabase pause does NOT delete data.** When the free-tier project is paused and later restored, all tables and rows come back. If problems appear "missing", first probe the REST API (`/rest/v1/150DayProblems?select=id` with the anon key) before considering a reseed.
- **Do not run `npm run migrate` to "fix" a live DB** — it drops tables and wipes all user progress + regenerates problem UUIDs (which orphans `user_solves`). Only the seed script is safe/idempotent.
