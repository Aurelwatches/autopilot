# AutoPilot — Visual Redesign Claude Code Prompt

Paste this into a Claude Code session to redesign the dashboard visuals.

---

## Context

This is a SaaS dashboard for independent restaurants called **AutoPilot**. It automates Google review replies and social posts using AI.

**Stack:**
- React 18 + Vite + Tailwind CSS
- Inline styles via `C` palette from `useApp()` — NEVER hardcode hex values in dashboard components
- Colors always come from `const { C } = useApp()` — e.g. `C.primary`, `C.secondary`, `C.accent`, `C.card`, `C.border`, `C.inputBg`, `C.divider`, `C.muted`
- Two themes: `dark` (#0A0A0A bg) and `light` (#F5F4F0 bg)
- Accent color: `#22D3EE` (cyan) — referenced as `C.accent` or `var(--ap-accent)`
- Font: `Bricolage Grotesque` for headings, system sans for body

**Key files:**
- `src/dashboard/AppContext.jsx` — color palette definitions
- `src/dashboard/pages/Overview.jsx` — main dashboard home
- `src/dashboard/pages/Reviews.jsx` — review management
- `src/dashboard/pages/SocialPosts.jsx` — social posting
- `src/dashboard/pages/Analytics.jsx` — analytics charts
- `src/dashboard/pages/Settings.jsx` — settings page
- `src/dashboard/Sidebar.jsx` — navigation sidebar
- `src/dashboard/Onboarding.jsx` — first-time tutorial modal

---

## Visual Redesign Goals

Redesign the dashboard to feel more **premium, modern, and polished**. Think: Vercel, Linear, or Raycast dashboard aesthetics.

### 1. Overview page (`src/dashboard/pages/Overview.jsx`)
- Stat cards should have subtle gradient overlays (cyan accent top-to-transparent)
- Add micro-animations on card mount (fade in + slight translateY)
- Activity feed items should have a thin left accent bar colored by type (review = cyan, post = purple, message = green)
- Make numbers in stat cards larger and more prominent (32-36px, bold)

### 2. Reviews page (`src/dashboard/pages/Reviews.jsx`)
- Star ratings should use proper gold star SVGs instead of emoji
- Review cards should have a subtle left border colored by rating (5★ = green, 3-4★ = yellow, 1-2★ = red)
- The "AI Reply" text should be in a slightly differentiated background block with a small robot icon
- Approve button should pulse subtly when a reply is ready

### 3. Sidebar (`src/dashboard/Sidebar.jsx`)
- Active nav item should have a glow effect (box-shadow with accent color)
- Logo "AutoPilot" should animate on hover — "Pilot" text glows cyan
- Add a thin gradient line separator between nav groups
- User avatar area at bottom should be more polished

### 4. General card polish (applies everywhere)
- Cards should have `box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)`
- Border radius: 16px for main cards, 12px for inner elements
- All buttons should have smooth 150ms opacity/color transitions
- Empty states should have an icon + friendly message instead of blank space

### 5. Typography tightening
- All page titles: `font-size: 24px, font-weight: 800, letter-spacing: -0.025em`
- All section headings: `font-size: 13px, font-weight: 600, text-transform: uppercase, letter-spacing: 0.06em, color: C.muted`
- Body text: `font-size: 14px, line-height: 1.6`

---

## Rules to follow

1. **Never hardcode hex values** — always use `C.xxx` palette or `var(--ap-xxx)` CSS variables
2. **No new dependencies** — no framer-motion, no new animation libraries. Use CSS transitions and keyframes only
3. **Preserve all existing functionality** — only change visual styling, not logic
4. **Read each file before editing** — do not guess at existing structure
5. **Push via `tools/git_push.bat`** — NEVER run `git push` directly
6. Tailwind utility classes + inline styles only — no CSS modules, no styled-components

---

## How to push

After making changes, open File Explorer → `C:\Users\brayd\autopilot\tools` → double-click `git_push.bat`. It will commit and push automatically. Vercel auto-deploys in ~60s.
