# Logbook — Training & Provisions

A mobile-first PWA that combines progressive strength programming, nutrition
logging, body-metric tracking and a data-driven coach. Open the app and
immediately know what to do today: what lift, what load, what to eat, what's
left.

Design language is a ship's logbook / field journal — navy masthead, gold
progress ring, cream paper pages, dashed ledger rules — deliberately not a
generic SaaS dashboard. Colors, type, and spacing are ported pixel-for-pixel
from the original design spec.

## Status

**Built:** all five tabs (Today, Train, Fuel, Progress, More), Workout Mode,
the bottom-sheet overlays (food/recipe/swap/feedback), the progression
engine, calorie/macro math, meal planning + grocery list, the coach, PWA
manifest + service worker + icons, passcode auth, and Postgres-backed sync
between devices.

**Not built / intentionally deferred:** real user accounts (this is a
single-passcode, single-account app by design), offline write queuing beyond
a local cache fallback (see Architecture), and the branded app icon (a
placeholder navy/gold ring mark ships in `public/icons/` — swap in real
artwork before shipping to app stores or a home screen you'll show other
people).

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind v4.**
- **Domain logic** (`src/lib/domain/`) is framework-free, pure functions:
  Mifflin-St Jeor BMR/TDEE/macros, 12-week program generation, the
  double-progression engine, meal planning, weekly scoring, and the
  keyword-routed coach. This is the part worth reading if you want to verify
  the numbers — every branch is a pure function you can unit test.
- **State**: Zustand (`src/lib/store/useStore.ts`) holds the whole app's
  state (`Db`) plus UI-only state (active tab, open sheet, workout session in
  progress, drafts). All writes go through one `edit(fn)` action that clones
  state, mutates the clone, and schedules a debounced save.
- **Persistence**: a `DbRepository` interface (`src/lib/repository/`)
  abstracts storage. The current implementation talks to `/api/state`
  (Prisma + Postgres) and keeps a `localStorage` mirror as an offline-read
  fallback if the network is unreachable. Swapping to a different backend
  means writing a new class that implements `DbRepository` — no UI or store
  changes needed.
- **Sync model**: last-write-wins. Edits are optimistic (UI updates
  immediately) and saved to the server after a 400ms debounce; the debounce
  flushes immediately when the tab is hidden/closed. Bringing the tab back to
  the foreground refetches from the server (unless a local edit is still
  pending, in which case that gets flushed first instead of being
  overwritten). This is intentionally simple: don't edit the same field on
  two devices in the same few seconds and expect a merge — the later write
  wins, matching how the app is meant to be used (one person, one device at
  a time).
- **Auth**: one shared passcode (`APP_PASSCODE`), not a full account system.
  Correct passcode → an HMAC-signed, httpOnly session cookie good for 90
  days. `src/proxy.ts` (Next's `middleware`→`proxy` rename in this version)
  gates every route except `/login` and the login API.
- **Data model**: a single `AppState` row in Postgres holding the entire
  app state as one JSON blob (see `prisma/schema.prisma`). This mirrors the
  original design prototype's local-storage shape almost exactly, just moved
  server-side — there was no need for a relational rewrite for a
  single-account app. The exercise/food/recipe library
  (`src/lib/data/source.ts`) is static reference content shipped in code, not
  stored per-account.
- **PWA**: `public/manifest.webmanifest` + `public/sw.js` (cache-first app
  shell). Icons are in `public/icons/` (192, 512, maskable 512) — currently a
  generated placeholder mark; see Status above.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values, see below
npm run db:migrate:dev       # applies prisma/migrations against DATABASE_URL
npm run dev
```

You need a real Postgres reachable from `DATABASE_URL` even for local dev —
either a local Postgres (`createdb logbook_dev`, then point `DATABASE_URL` at
it) or a Neon branch. `APP_PASSCODE` is whatever you want to type on the
login screen; `APP_SESSION_SECRET` is any random string (`openssl rand -base64
32`).

## Deploying: Neon + Vercel

This app needs a Postgres database reachable from wherever it's hosted, plus
two secrets. Neon (serverless Postgres) + Vercel is the path this repo is
set up for, but any Postgres host works — only `DATABASE_URL` needs to point
at it.

1. **Create the database.**
   - Go to [neon.tech](https://neon.tech), sign in, and create a new project.
   - In the project dashboard, open **Connection Details** and copy the
     **pooled** connection string (it looks like
     `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
     Use the pooled string, not the direct one — Vercel's serverless
     functions open many short-lived connections, which a non-pooled
     Postgres connection limit will choke on.

2. **Connect the repo to Vercel.**
   - Go to [vercel.com/new](https://vercel.com/new) and import this GitHub
     repository.
   - Framework preset should auto-detect as Next.js. Leave build/output
     settings default — `package.json`'s `build` script already runs
     `prisma migrate deploy && next build`, so migrations apply
     automatically on every deploy once `DATABASE_URL` is set (step 3).

3. **Set environment variables** (Vercel dashboard → Project → Settings →
   Environment Variables — add for both Production and Preview):
   - `DATABASE_URL` — the Neon pooled connection string from step 1.
   - `APP_PASSCODE` — the passcode you'll type on the login screen.
   - `APP_SESSION_SECRET` — a random string (`openssl rand -base64 32`
     locally, then paste the output).

4. **Deploy.** Trigger a deploy (push to the connected branch, or click
   Deploy in the Vercel dashboard). The build log should show `prisma
   migrate deploy` applying `20260829000000_init` the first time, then
   `next build` completing.

5. **First login.** Visit the deployed URL, enter the `APP_PASSCODE` you
   set. The first `GET /api/state` call creates the single `AppState` row
   with a fresh empty account (real exercise/food/recipe library, zero
   logged history). Fill in **Profile & targets** on the More tab with your
   real numbers, then tap **Rebuild program** so the training plan and meal
   plan are generated from your actual stats rather than the placeholder
   defaults.

6. **Install it as an app.** On a phone, open the deployed URL in the
   browser and use "Add to Home Screen" (iOS Safari) or the install prompt
   (Android Chrome). On desktop, most Chromium browsers show an install icon
   in the address bar. Because state now lives in Postgres rather than
   per-device `localStorage`, the same login on your phone and your desktop
   see the same data.

### Verifying a deploy didn't silently break the database

Because `prisma migrate deploy` runs as part of every build, a schema change
that reaches `main` applies automatically. If you ever add a migration,
confirm it applied by checking the Vercel build log for `prisma migrate
deploy` output, or query the DB directly:

```bash
DATABASE_URL="<your Neon connection string>" npx prisma migrate status
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | `prisma migrate deploy && next build` — what Vercel runs |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply pending migrations (production-style) |
| `npm run db:migrate:dev` | Create/apply migrations against a dev database |

## Porting notes (for anyone touching the domain logic)

`src/lib/domain/` was ported near-verbatim from a design prototype's logic
class. If you're verifying a change against the original spec, the load-bearing
pieces are:

- `progression.ts` — the double-progression rule set (rep-range clear → +load,
  RPE ≥9.3 or under rep floor → −8% back-off, otherwise chase one more rep;
  deload weeks apply ×0.85 and drop one set).
- `calc.ts` — Mifflin-St Jeor BMR, activity multipliers, calorie target by
  goal, protein/fat/carb split.
- `mealPlan.ts` — recipes assigned to slots by calorie share, rotated by day
  index among the closest-fitting matches.
- `coach.ts` — keyword-routed responses, every branch computed from real
  state (no canned numbers).

Seed/demo data was intentionally removed (see git history if you need it) —
this app ships with the reference library (52 exercises, 55 foods, 26
recipes) but zero fabricated workout/food/weight history. `emptyState()` in
`src/lib/domain/seed.ts` is what a brand-new account actually starts with.
