# AutoPilot — Claude Code Context

SaaS dashboard for independent restaurants. Automates Google review replies, social posts, and customer follow-up messages via Make.com + AI.

---

## How to work on this project

### Before touching any code
- Read the file you're editing first — never guess at existing structure
- Check what Supabase columns actually exist before writing queries
- The backend is on Railway, frontend on Vercel — they are separate services

### Coding rules
- **Colors**: never hardcode hex values in any dashboard component — always use `const { C } = useApp()` and reference `C.primary`, `C.secondary`, `C.accent`, `C.card`, `C.border`, `C.inputBg`, `C.divider`, `C.muted`, etc.
- **HTTP**: use native `fetch()` — no axios
- **Styling**: Tailwind utility classes + inline styles via `C` palette. No CSS modules, no styled-components
- **State**: React `useState` / `useEffect` — no Redux, no Zustand
- **Backend**: ESM (`import`/`export`) throughout — never `require()`
- **Supabase on backend**: always use `SUPABASE_SERVICE_KEY` (bypasses RLS). Frontend uses `VITE_SUPABASE_ANON_KEY`

### Deploying
- **ONLY** push via `tools\git_push.bat` — never `git push` directly (git index can go stale)
- `git_push.bat` does: `del .git\index` → `git reset` → `git add -A` → commit → push
- Vercel auto-deploys frontend, Railway auto-deploys backend + bot on every push
- After pushing, watch Vercel dashboard for build status — build takes ~60s

### What not to do
- Never commit `.env` — it's gitignored, Railway + Vercel have env vars set in their dashboards
- Never hardcode the Railway URL — use `import.meta.env.VITE_API_URL` in frontend, `process.env.BACKEND_URL` in backend
- Never change `status='replied'` filter in `processQueuedReplies` back to `'pending'` — that was the bug, `'replied'` is correct
- Never add a Root Directory setting in Vercel — it must stay blank (monorepo: frontend at root, backend in `/backend`)
- Don't add npm scripts that start both server and vite together for production — Railway runs them as separate services

### Adding new features
1. If it needs a new Supabase column — add a migration via Supabase MCP (`apply_migration`) before writing code that uses it
2. If it's a new API route — add it to `backend/server.js` and update the routes table in this file
3. If it's a new dashboard page — add the route in `src/App.jsx` and a nav link in `Sidebar.jsx`
4. If it touches Google API — test token refresh logic; tokens expire after 1 hour

---

---

## Deployments

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | (auto from git push) |
| Backend (Express) | Railway service `autopilot` | `https://autopilot-production-7671.up.railway.app` |
| Discord bot | Railway service `worker` | same repo, different start command |

- **Vercel project**: `prj_Pjrl3KVpmCn8M2RrEcGYnLoR0YAJ` team `team_9OYaYHxnWyrwn4tnluAAzSDQ`
- **vercel.json** sets `buildCommand: "npm install && npm run build"` and rewrites `/*` → `/index.html`
- **Git push** via `tools/git_push.bat` (runs `git add -A`, commits, pushes — triggers both Vercel + Railway auto-deploy)

---

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (utility classes + inline styles via `C` palette from `useApp()`)
- **Backend**: Express on `backend/server.js`, port 3001 (Railway sets `PORT` env)
- **Database**: Supabase — project `dlxnrgdrhcptnwdcpahp`
- **Bot**: Discord.js in `backend/bot.js` — receives customer messages, posts to Discord, Reply button
- **AI**: Anthropic Claude API (review reply generation), Groq (social post generation)
- **Automation**: Make.com webhooks → `/api/webhook` on Express
- **Payments**: Stripe (checkout + portal + webhooks)
- **SMS**: Twilio
- **Email**: Resend

---

## Key files

```
backend/
  server.js               — Express app, all API routes, cron jobs
  google-oauth-routes.js  — Google Business Profile OAuth (connect + callback)
  google-reviews-poller.js — Cron every 5 min: fetches new reviews, fires Make.com webhook
  bot.js                  — Discord bot

src/dashboard/
  AppContext.jsx           — Global state: userId, restaurantName, theme, C (color palette), plan
  DashboardContext.jsx     — SSE stream from /api/events/stream → reviews, posts, stats
  DashboardLayout.jsx      — Wraps AppProvider + DashboardProvider
  Sidebar.jsx              — Nav links + theme toggle
  pages/
    Overview.jsx
    Reviews.jsx
    SocialPosts.jsx
    Analytics.jsx
    Settings.jsx           — Connections, prefs, billing, business hours, notifications
    Subscription.jsx

tools/
  git_push.bat            — ONLY way to push from this machine (runs git add -A + commit + push)
```

---

## API routes (backend/server.js)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/webhook/stripe` | Stripe events (checkout.completed, sub.deleted, etc.) |
| POST | `/api/webhook` | Make.com sends review data here → saves to Supabase + schedules reply |
| GET | `/api/events` | Snapshot of in-memory events array |
| GET | `/api/events/stream` | SSE stream to frontend |
| POST | `/api/reviews/set-reply` | Manually set reply text for a review |
| POST | `/api/reply` | Discord bot reply → saves to Supabase messages |
| POST | `/api/generate-post` | Claude-generated social post |
| POST | `/api/generate-post-groq` | Groq-generated social post |
| POST | `/api/discord/message` | Proxy to Discord webhook |
| POST | `/api/auth/google/select-location` | Save chosen location after multi-location picker |
| POST | `/api/create-checkout-session` | Stripe checkout |
| POST | `/api/create-portal-session` | Stripe billing portal |
| POST | `/api/reviews/:reviewId/approve` | Approve a pending review reply → posts to Google |
| POST | `/api/smoke-test` | Health-check all integrations |
| GET | `/api/auth/google/connect` | Start Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/health` | Uptime check |

---

## Cron jobs (backend/server.js)

- **Every 2 min** — `processQueuedReplies()`: picks up reviews with `status='replied'` and `scheduled_at <= now`, posts reply to Google Business API, sets `status='posted'`
- **Every 5 min** — `startReviewsPoller()` (in google-reviews-poller.js): finds profiles with `google_refresh_token`, fetches unanswered reviews, fires Make.com webhook, logs to `processed_reviews` table

---

## Google Business Profile flow

1. Client clicks Connect → `/api/auth/google/connect?user_id=X` → Google OAuth
2. Callback saves tokens + all locations to `profiles` table
3. If multiple locations → redirect to `/settings?choose_location=true` → frontend shows picker
4. Poller runs every 5 min → fires Make.com webhook with review data
5. Make.com generates AI reply via Groq → POST to `/api/webhook`
6. Webhook checks `auto_post_enabled` + `reply_speed` → computes `scheduled_at` → saves `status='replied'`
7. `processQueuedReplies` cron picks it up → posts to Google API → `status='posted'`

---

## Supabase tables

### profiles
Key columns: `id`, `plan`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
`google_access_token`, `google_refresh_token`, `google_token_expires_at`,
`google_account_id`, `google_location_id`, `google_locations` (JSONB array of `{id, name}`),
`google_connected_at`, `auto_post_enabled` (boolean), `reply_speed`, `post_tone`,
`business_hours` (JSONB: `{enabled, open, close, timezone}`),
`notification_prefs` (JSONB: `{alerts, phone_email}`), `onboarded`

### reviews
`id`, `review_id` (Google review ID), `client_id` (FK → profiles), `customer_name`,
`review_text`, `ai_reply`, `rating`, `status` (`pending` | `replied` | `posted`),
`scheduled_at`, `created_at`

### processed_reviews
`id`, `review_id`, `client_id`, `status`, `created_at`
(used by poller to avoid re-firing webhook for same review)

### messages
`id`, `restaurant_name`, `message`, `reply`, `replied_at`, `status`, `created_at`

### activity_feed
`id`, `type`, `details`, `platform`, `created_at`

---

## Theme system

Two themes in `AppContext.THEMES`: `dark` (`#0A0A0A` bg) and `light` (`#F5F4F0` bg).
Every dashboard component reads `const { C } = useApp()` for colors — never hardcode hex in dashboard components.
Toggle via `toggleTheme()`, saved to `localStorage('ap_theme')`.

---

## Environment variables

```
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BACKEND_URL=               # e.g. https://autopilot-production-7671.up.railway.app
FRONTEND_URL=              # e.g. https://your-vercel-url.vercel.app

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=

# Discord
DISCORD_BOT_TOKEN=
DISCORD_CHANNEL_ID=
VITE_DISCORD_WEBHOOK_URL=

# AI
ANTHROPIC_API_KEY=
VITE_GROQ_API_KEY=

# Make.com
MAKE_WEBHOOK_URL=          # poller fires review data here
VITE_WEBHOOK_URL=          # shown in Settings as client's webhook URL

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Other
VITE_API_URL=              # Railway backend URL for frontend fetch calls
PORT=3001
```

---

## Dev

```bash
npm run dev   # starts Express (3001) + Vite (5173) + Discord bot concurrently
```

**NEVER commit `.env`** — it's in `.gitignore`. Use `tools/git_push.bat` to push, never `git push` directly (index may be stale).

---

## Common gotchas

- `processQueuedReplies` filters `status='replied'` (not `'pending'`) — auto-post reviews are saved as `'replied'` with `scheduled_at` set
- `google_locations` is JSONB array `[{id: "123", name: "My Restaurant - Downtown"}, ...]`
- Vercel only serves the frontend — all `/api/*` calls go to Railway backend via `VITE_API_URL`
- Railway has two services: `autopilot` (server.js) and `worker` (bot.js) — they deploy from the same repo
- Admin page at `/admin` — password `autopilot-admin` — for dev/support only
