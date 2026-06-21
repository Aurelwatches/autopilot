# AutoPilot Build Day Brief — Monday, June 22, 2026

Good morning Braydon. Here's your priority order for today. Steps 1–4 are sequential and the main push.

---

## Priority 1 — Get API Keys (YOU, ~9:00 AM)

Sign up and grab live credentials from:

- **Twilio** → [twilio.com/try-twilio](https://twilio.com/try-twilio)
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER` (buy a number in the console)

- **Resend** → [resend.com](https://resend.com)
  - `RESEND_API_KEY`

Also have ready: `GROQ_API_KEY`, `DISCORD_WEBHOOK_URL`

---

## Priority 2 — Paste Keys into Railway + Clean Vercel (YOU, ~9:20 AM)

1. Open Railway → autopilot service → Variables
2. Add/update: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `RESEND_API_KEY`, `GROQ_API_KEY`, `DISCORD_WEBHOOK_URL`
3. Open Vercel → Settings → Environment Variables
4. Delete any old `VITE_` versions of keys that only belong on the backend
5. Redeploy both Railway services (autopilot + worker)

---

## Priority 3 — Stripe Free Trial (CLAUDE CODE, ~9:30 AM)

While Railway is redeploying, open Claude Code in this repo and prompt:

> "Add `trial_period_days` to the Stripe checkout session so new users get a free trial."

This touches `backend/server.js` → `/api/create-checkout-session`.

---

## Priority 4 — Smoke Test (YOU + CLAUDE CODE, ~10:00 AM)

Once Railway is back up, tell Claude: "Railway is redeployed — run the smoke test."

Claude will hit `/api/smoke-test` and verify SMS (Twilio), email (Resend), and other integrations are live.

---

## Background — Ongoing (COWORK, anytime)

- Finish AutoPilot folder organization
- Build TikTok day subfolders with scripts
- Build McLean's pitch kit folder

---

## Your Decisions Needed (anytime)

These don't block the build but need a call from you:

| Decision | Options |
|---|---|
| Old empty-reply reviews | Re-trigger Make.com webhook? Or leave them as-is? |
| Discord bot | Fix the broken reply flow? Or kill it and go SMS-only? |
| Meta description | Add one to `index.html` for SEO? Or skip for now? |

---

**Today's goal: SMS + email confirmed working, free trial live, Railway + Vercel clean.**

Let's get it. 🔥
