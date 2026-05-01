# BarIntel

BarIntel is an Olympic weightlifting training log built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

The app helps athletes track workouts, sets, PRs, success rates, and lift progress over time.

## Features

- Google sign-in using Supabase Auth
- Workout logger with exercises, sets, bodyweight, notes, and rep tracking
- Dashboard showing latest session, PRs, volume, and success rate
- Training history with workout detail pages
- Analysis charts for weekly volume, lift progress, and success trends
- Supabase-backed user-scoped workout storage
- Local draft autosave for workout composition

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Recharts
- React Router DOM

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` file in the project root with your Supabase values:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the app in your browser at the URL shown by Vite.

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — build the production bundle
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint across the project

## Supabase notes

- The app uses Supabase for authentication and workout storage.
- Google OAuth is expected to be enabled in your Supabase project for login.
- The `.env` file should not be committed to source control.
- The repo includes `supabase/migrations/` for database schema and permission setup.

## Project structure

- `src/` — application source code
- `src/pages/` — page components for Dashboard, Logger, Analysis, History, Login, Profile, and workout detail
- `src/lib/supabase.ts` — Supabase client setup
- `src/data/workouts.ts` — workout persistence logic
- `src/utils.ts` — helper functions for metrics and analytics
- `src/supportedLifts.ts` — supported Olympic lift definitions
- `supabase/migrations/` — SQL migrations for database schema

## Notes

- If you want to publish this repo publicly, keep secrets out of version control by adding `.env` to `.gitignore`.
- The Supabase publishable key is safe for client-side use, but project secrets should remain private.
