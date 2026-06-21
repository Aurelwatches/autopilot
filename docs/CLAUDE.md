# AutoPilot — Claude Code Context

AutoPilot is a SaaS dashboard for independent restaurants that automates review replies, social posts, and customer follow-up texts via Make.com + AI.

## Stack
- **Frontend**: React 18, Vite, Tailwind CSS (utility classes + inline styles)
- **Backend**: Express server (`server.js`) on port 3001
- **Database**: Supabase (Postgres)
- **Bot**: Discord.js bot (`bot.js`) — receives customer messages, posts to Discord with Reply button
- **AI**: Anthropic Claude API (review replies), Groq (social post generation)
- **Automation**: Make.com webhooks trigger the Express server

## Key files
- `src/dashboard/AppContext.jsx` — global state: `restaurantName`, `theme` (dark/light), `C` (color palette). All dashboard pages read colors from `useApp()`.
- `src/dashboard/DashboardContext.jsx` — SSE stream from `/api/events/stream`, derives `reviews`, `posts`, `followUps`, `stats` from in-memory events.
- `src/dashboard/DashboardLayout.jsx` — wraps with `AppProvider` + `DashboardProvider`, applies background color.
- `src/dashboard/Sidebar.jsx` — nav links (no Follow-ups, no Messages), theme toggle (sun/moon), restaurant name.
- `src/dashboard/SupportChat.jsx` — floating chat bubble that opens a full conversation thread (360×500px) showing all messages + replies from Supabase.

## Theme system
Two themes in `AppContext.THEMES`: `dark` (`#0A0A0A` bg, `#F0EEE9` text) and `light` (`#F5F4F0` bg, `#0A0A0A` text). Toggled via `toggleTheme()`, saved to `localStorage('ap_theme')`. Every component reads `const { C } = useApp()` for colors — never hardcode hex values in dashboard components.

## Personalization
`restaurantName` from `localStorage('ap_restaurant')`, default `'Your Restaurant'`. Updated via Settings → Save changes. Appears in Overview greeting, sidebar bottom, and SupportChat webhook payload.

## Supabase tables
- `messages` — `id, restaurant_name, message, reply, replied_at, status, created_at`
- `reviews` — `id, customer_name, review_text, ai_reply, rating, status, created_at`
- `activity_feed` — `id, type, details, platform, created_at`

## Dashboard pages
- `/dashboard/overview` — live activity feed, clickable stat cards linking to their pages
- `/dashboard/reviews` — fetches from Supabase `reviews` table directly (not SSE), filter tabs, real star ratings
- `/dashboard/posts` — social post cards + New Post modal with AI assist (Groq)
- `/dashboard/analytics` — recharts line/bar charts from Supabase, date range filter (30d/90d/1y), `#E8A020` accent color
- `/dashboard/settings` — controlled form saving to localStorage + AppContext; Connected accounts default to "Not connected" with localStorage-backed state per restaurant; Appearance card for theme toggle
- `/admin` — hidden admin page (password: `autopilot-admin`), restaurant lookup, Supabase stats, webhook URL

## Buttons — all wired up
- Overview stat cards: clickable, navigate to relevant page
- Reviews filter tabs: All / Replied / Pending / 5 Star / 1–2 Star
- Social Posts: New Post (opens modal), AI Assist (Groq API), Delete (confirm → animate out), Save Draft / Schedule Post
- Analytics: date range filters (30d / 90d / 1y) update all charts instantly
- Settings: Save writes to localStorage + AppContext; Connect/Disconnect per service; theme toggle

## Messages / Chat bubble
Removed Messages page from sidebar and routing. The floating chat bubble (`SupportChat.jsx`) is the only entry point — opens a 360×500px conversation thread. Custom slim scrollbar (4px, `#2A2A2A` dark / `#CCCCCC` light, visible on hover only via `.chat-scroll` / `.chat-scroll-light` CSS classes in `index.css`).

## Discord bot flow
1. Customer sends message → saved to Supabase `messages` → webhook to Discord channel
2. Bot listens for webhook messages starting with `📨`, parses `Reply ID: {uuid}`, posts embed with Reply button
3. Staff clicks Reply → modal → POST `/api/reply` → updates Supabase row with reply text
4. SupportChat polls every 12s and shows the reply in the thread

## Environment variables (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
VITE_DISCORD_WEBHOOK_URL=
DISCORD_BOT_TOKEN=
DISCORD_CHANNEL_ID=
VITE_GROQ_API_KEY=
VITE_WEBHOOK_URL=        # Make.com webhook URL shown in Settings
ANTHROPIC_API_KEY=
API_URL=                 # bot.js → server URL, default http://localhost:3001
```

## Dev
```bash
npm run dev   # starts Express (3001) + Vite (5173) + Discord bot concurrently
```
