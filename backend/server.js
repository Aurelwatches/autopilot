// AutoPilot backend — v2
import express from 'express'
import helmet from 'helmet'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import cron from 'node-cron'
import twilio from 'twilio'
import { Resend } from 'resend'
import googleOAuthRoutes from './google-oauth-routes.js'
import { startReviewsPoller, getValidAccessToken } from './google-reviews-poller.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(googleOAuthRoutes)
app.set('trust proxy', 1)

// ── Security headers ──────────────────────────────────────────────────────────
// This is a pure API server (no HTML pages), so CSP is disabled.
// All other protections (X-Frame-Options, X-Content-Type-Options, HSTS, etc.) apply.
app.use(helmet({
  contentSecurityPolicy: false,           // API-only — no HTML to protect
  crossOriginResourcePolicy: false,       // allow cross-origin requests from the frontend
}))

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function sendSms(to, body) {
  if (!twilioClient) throw new Error('Twilio not configured (missing env vars)')
  const msg = await twilioClient.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body })
  console.log('[SMS] Sent:', msg.sid, 'status:', msg.status)
  return { sid: msg.sid, status: msg.status, from: process.env.TWILIO_FROM_NUMBER, to }
}

// Build a branded "AutoPilot <addr>" from string
function buildFromAddress() {
  const raw = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  // If already formatted like "Name <addr>", use as-is; otherwise wrap it
  return raw.includes('<') ? raw : `AutoPilot <${raw}>`
}

// Shared branded email wrapper — every email gets this shell
function emailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#ffffff">
              Auto<span style="color:#22d3ee">Pilot</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #f0f0f0">
            <p style="margin:0;font-size:11px;color:#9ca3af">AutoPilot — AI-powered review management for restaurants. You're receiving this because you have an AutoPilot account.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendEmail({ to, subject, html }) {
  if (!resend) throw new Error('Resend not configured (missing RESEND_API_KEY)')
  const { data, error } = await resend.emails.send({
    from: buildFromAddress(),
    to,
    subject,
    html: emailHtml(html),
  })
  if (error) {
    console.error('[Email] Resend error:', JSON.stringify(error))
    throw new Error(JSON.stringify(error))
  }
  console.log('[Email] Sent successfully — id:', data?.id, '→', to)
}

// CORS — only allow known origins
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://www.getautopilot.net',
  'https://getautopilot.net',
  'https://autopilot-pink.vercel.app',
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

// ── Security monitoring ───────────────────────────────────────────────────────
// Tracks attack attempts in Supabase and sends alerts when thresholds are hit.

const ALERT_COOLDOWNS = new Map() // type+ip → last alert timestamp

async function logSecurityEvent(type, req, details = {}) {
  if (!supabase) return
  const ip = req?.ip || details.ip || 'unknown'
  const path = req?.path || details.path || ''
  try {
    await supabase.from('security_events').insert({ type, ip, path, details })
  } catch (e) {
    console.warn('[Security] Failed to log event:', e.message)
  }
  // Check if this IP has hit alert threshold — alert at most once per 10 min per type+IP
  const cooldownKey = `${type}:${ip}`
  const lastAlerted = ALERT_COOLDOWNS.get(cooldownKey) || 0
  if (Date.now() - lastAlerted < 10 * 60 * 1000) return // still in cooldown

  const windowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await supabase.from('security_events')
    .select('id', { count: 'exact', head: true })
    .eq('type', type).eq('ip', ip).gte('created_at', windowStart)

  const thresholds = { failed_auth: 5, webhook_rejected: 3, rate_limited: 10, suspicious_input: 2 }
  if (count >= (thresholds[type] || 5)) {
    ALERT_COOLDOWNS.set(cooldownKey, Date.now())
    sendSecurityAlert(type, ip, path, count, details).catch(e => console.warn('[Security] Alert failed:', e.message))
  }
}

async function sendSecurityAlert(type, ip, path, count, details) {
  const labels = {
    failed_auth:      '🔐 Failed Auth Flood',
    webhook_rejected: '🚨 Fake Webhook Attempt',
    rate_limited:     '⚡ Rate Limit Flood',
    suspicious_input: '💉 Suspicious Input',
  }
  const label = labels[type] || '⚠️ Security Alert'
  const msg = `${label}\nIP: ${ip}\nPath: ${path}\nCount: ${count} in last 5 min\nDetails: ${JSON.stringify(details)}`
  console.warn('[Security Alert]', msg)

  // Discord
  const discordUrl = process.env.VITE_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL
  if (discordUrl) {
    fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**${label}**\`\`\`${msg}\`\`\`` }),
    }).catch(() => {})
  }

  // Email to owner
  if (resend && process.env.OWNER_ALERT_EMAIL) {
    sendEmail({
      to: process.env.OWNER_ALERT_EMAIL,
      subject: `[AutoPilot Security] ${label}`,
      html: `<h2>${label}</h2><p><strong>IP:</strong> ${ip}</p><p><strong>Path:</strong> ${path}</p><p><strong>Count:</strong> ${count} attempts in the last 5 minutes</p><pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:13px">${JSON.stringify(details, null, 2)}</pre><p style="color:#6b7280;font-size:12px">This alert won't repeat for this IP for 10 minutes.</p>`,
    }).catch(() => {})
  }
}

// ── Auth middleware ───────────────────────────────────────────────────────────
// Validates the Supabase JWT. Accepts:
//   - Authorization: Bearer <token>  (standard REST calls)
//   - ?token=<token>                 (EventSource/SSE — can't set headers)
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization?.replace('Bearer ', '') || req.query.token || '').trim()
  if (!token) {
    logSecurityEvent('failed_auth', req, { reason: 'no_token' })
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    logSecurityEvent('failed_auth', req, { reason: 'invalid_token' })
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.user = user
  next()
}

// ── Stripe webhook ────────────────────────────────────────────────────────────
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' })

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id || session.metadata?.userId
    const plan = session.metadata?.plan ?? 'unknown'
    const interval = session.metadata?.interval ?? 'monthly'
    if (userId && supabase) {
      // Fetch the subscription to get current_period_end
      let periodEnd = null
      if (session.subscription && stripe) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
        } catch (e) { console.warn('[Stripe] Could not retrieve subscription:', e.message) }
      }
      const { error } = await supabase.from('profiles').update({
        plan,
        plan_interval: interval,
        subscribed_at: new Date().toISOString(),
        subscription_status: 'active',
        stripe_customer_id: session.customer ?? null,
        cancel_at_period_end: false,
        stripe_current_period_end: periodEnd,
      }).eq('id', userId)
      if (error) console.error('Supabase profile update error:', error.message)
      // email lives in auth.users — fetch via admin API
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
      if (authUser?.email) {
        sendEmail({
          to: authUser.email,
          subject: '🎉 Welcome to AutoPilot!',
          html: `<h2>You're in!</h2><p>Your <strong>${plan}</strong> plan is now active. Head to your <a href="${process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'}/dashboard">dashboard</a> to get started.</p><p>Your 14-day free trial has started — you won't be charged until it ends.</p>`,
        })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    if (sub.customer && supabase) {
      const { error } = await supabase.from('profiles')
        .update({ subscription_status: 'canceled', plan: null, plan_interval: null })
        .eq('stripe_customer_id', sub.customer)
      if (error) console.error('[Stripe] subscription.deleted update failed:', error.message)
      else console.log('[Stripe] subscription canceled for customer', sub.customer)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object
    // Catch reactivations (cancel_at_period_end flipped back) and status changes
    if (sub.customer && supabase) {
      const statusMap = { active: 'active', past_due: 'past_due', unpaid: 'past_due', canceled: 'canceled', trialing: 'active' }
      const newStatus = statusMap[sub.status] ?? sub.status
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
      const { error } = await supabase.from('profiles')
        .update({
          subscription_status: newStatus,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          stripe_current_period_end: periodEnd,
        })
        .eq('stripe_customer_id', sub.customer)
      if (error) console.error('[Stripe] subscription.updated failed:', error.message)
      else console.log(`[Stripe] subscription updated → ${newStatus}, cancel_at_period_end=${sub.cancel_at_period_end} for customer`, sub.customer)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const customerId = event.data.object.customer
    if (customerId && supabase) {
      const { data: profile, error } = await supabase.from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
        .select('id')
        .single()
      if (error) console.error('[Stripe] payment_failed update failed:', error.message)
      else {
        console.log('[Stripe] payment failed for customer', customerId)
        // email lives in auth.users — fetch via admin API
        if (profile?.id) {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.email) {
            sendEmail({
              to: authUser.email,
              subject: 'Action required: AutoPilot payment failed',
              html: `<h2>Payment failed</h2><p>We couldn't process your AutoPilot subscription payment. Please update your billing info to keep your account active.</p><p><a href="${process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'}/dashboard/subscription">Update billing →</a></p>`,
            })
          }
        }
      }
    }
  }

  if (event.type === 'invoice.paid') {
    // Clears past_due when payment succeeds after a retry
    const customerId = event.data.object.customer
    if (customerId && supabase) {
      await supabase.from('profiles')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', customerId)
        .eq('subscription_status', 'past_due')
    }
  }

  res.json({ received: true })
})

app.use(express.json({ limit: '100kb' }))

// ── Security helpers ──────────────────────────────────────────────────────────
function rateLimit({ windowMs, max }) {
  const hits = new Map()
  setInterval(() => {
    const now = Date.now()
    for (const [ip, rec] of hits) if (now > rec.resetAt) hits.delete(ip)
  }, windowMs).unref?.()
  return (req, res, next) => {
    const now = Date.now()
    const ip = req.ip || 'unknown'
    let rec = hits.get(ip)
    if (!rec || now > rec.resetAt) { rec = { count: 0, resetAt: now + windowMs }; hits.set(ip, rec) }
    rec.count++
    if (rec.count > max) {
      res.set('Retry-After', String(Math.ceil((rec.resetAt - now) / 1000)))
      logSecurityEvent('rate_limited', req, { max, path: req.path }).catch?.(() => {})
      return res.status(429).json({ error: 'Too many requests.' })
    }
    next()
  }
}

const webhookLimiter  = rateLimit({ windowMs: 60_000, max: 100 })
const replyLimiter    = rateLimit({ windowMs: 60_000, max: 100 })
const generateLimiter = rateLimit({ windowMs: 60_000, max: 20 })  // 20 AI generations/min per IP

function clean(v, maxLen = 5000) {
  if (v == null) return ''
  return String(v).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/<\/?[^>]*>/g, '').trim().slice(0, maxLen)
}

// Escape user content before embedding in HTML email bodies
function escHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// GET /api/debug/connection-status — shows exactly what's set per user
app.get('/api/debug/connection-status', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'user_id required' })
  if (user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  const { data: p } = await supabase.from('profiles')
    .select('google_refresh_token, google_access_token, google_account_id, google_location_id, google_connected_at, google_token_expires_at, reply_speed, auto_post_enabled, reply_tone')
    .eq('id', user_id).single()
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id)
  res.json({
    email: authUser?.email,
    google_connected:   !!p?.google_refresh_token,
    google_account_id:  p?.google_account_id  ?? null,
    google_location_id: p?.google_location_id ?? null,
    google_connected_at: p?.google_connected_at ?? null,
    token_expires_at:   p?.google_token_expires_at ?? null,
    groq_key_set:       !!(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY),
    resend_key_set:     !!process.env.RESEND_API_KEY,
    email_from:         process.env.EMAIL_FROM || 'onboarding@resend.dev (default)',
    reply_speed:        p?.reply_speed,
    auto_post_enabled:  p?.auto_post_enabled,
    reply_tone:         p?.reply_tone ?? null,
  })
})

// POST /api/test-pipeline — simulates a full review without Google connected
// Generates AI reply via Groq, saves to reviews table, sends email to account owner
app.post('/api/test-pipeline', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'user_id required' })
  if (user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: profile } = await supabase.from('profiles')
    .select('reply_speed, auto_post_enabled, business_hours, reply_tone, restaurant_name')
    .eq('id', user_id).single()
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id)
  const ownerEmail = authUser?.email
  if (!ownerEmail) return res.status(404).json({ error: 'User not found' })

  // Fake review data
  const restaurantName = profile?.restaurant_name || authUser?.user_metadata?.restaurant_name || 'Your Restaurant'
  const reviewerName   = 'Alex Thompson'
  const reviewText     = 'Absolutely loved the pasta! The atmosphere was warm and the staff were incredibly attentive. Will definitely be back.'
  const starRating     = 5

  // Generate AI reply via Groq
  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  let aiReply = '(GROQ_API_KEY not set — no AI reply generated)'
  if (groqKey) {
    try {
      const toneInstruction = profile?.reply_tone ? `\nPersonality & tone: ${profile.reply_tone}` : ''
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 300,
          messages: [{ role: 'user', content: `You are managing Google reviews for a restaurant. The review has a star rating of ${starRating} out of 5 stars. Write a warm enthusiastic thankful response.${toneInstruction}\nRestaurant name: ${restaurantName}\nReview: ${reviewText}\nSign off with the restaurant name. Return only the reply text, nothing else.` }]
        })
      })
      const groqData = await groqRes.json()
      if (groqRes.ok) aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply
    } catch (e) { aiReply = `Groq error: ${e.message}` }
  }

  // Save to reviews table
  const fakeReviewId = `test_${Date.now()}`
  await supabase.from('reviews').insert({
    user_id:       user_id,
    review_id:     fakeReviewId,
    customer_name: reviewerName,
    review_text:   reviewText,
    ai_reply:      aiReply,
    rating:        starRating,
    status:        'pending',
    created_at:    new Date().toISOString(),
  })

  // Send email notification
  let emailResult = 'skipped (Resend not configured)'
  if (resend) {
    try {
      const stars = '⭐⭐⭐⭐⭐'
      const frontendUrl = process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'
      const { data, error: emailErr } = await resend.emails.send({
        from: buildFromAddress(),
        to: ownerEmail,
        subject: `New ${starRating}★ review from ${reviewerName} — ${restaurantName}`,
        headers: { 'X-Entity-Ref-ID': fakeReviewId },
        html: emailHtml(`
          <h2 style="margin:0 0 4px;font-size:20px;color:#111">${stars} New Review</h2>
          <p style="margin:0 0 20px;font-size:13px;color:#888">${starRating}/5 stars · ${restaurantName}</p>
          <p style="margin:0 0 8px;font-size:15px;color:#374151"><strong>${reviewerName}</strong> wrote:</p>
          <blockquote style="margin:0 0 20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #22d3ee;border-radius:0 8px 8px 0;color:#555;font-size:14px;line-height:1.6">${reviewText}</blockquote>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em">AI Reply Ready</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;padding:14px 16px;background:#f0fdf4;border-radius:8px">${aiReply}</p>
          <a href="${frontendUrl}/dashboard/reviews" style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View in Dashboard →</a>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">(This is a test review — no real Google review was posted)</p>
        `),
      })
      emailResult = emailErr ? `failed: ${JSON.stringify(emailErr)}` : `sent (id: ${data?.id})`
    } catch (e) { emailResult = `exception: ${e.message}` }
  }

  res.json({
    ok: true,
    test_review_id: fakeReviewId,
    reviewer:       reviewerName,
    ai_reply:       aiReply,
    email_sent_to:  ownerEmail,
    email_result:   emailResult,
  })
})

// In-memory ring buffer + SSE
const events = []
const MAX_EVENTS = 50
const sseClients = new Map()

function pushToClients() {
  const payload = `data: ${JSON.stringify(events)}\n\n`
  sseClients.forEach(res => res.write(payload))
}

async function getUserId(restaurantName) {
  if (!supabase || !restaurantName) return null
  const { data } = await supabase.from('profiles').select('id').ilike('restaurant_name', restaurantName.trim()).limit(1).single()
  return data?.id ?? null
}

// Resolve a single owner user_id. Never fans out to all users (that creates
// one row per account on every webhook and poisons every dashboard).
async function resolveUserId(req, restaurantName) {
  const explicit = req.query.user_id ?? req.body.user_id
  if (explicit) return explicit

  const byName = await getUserId(restaurantName)
  if (byName) return byName

  if (process.env.DEFAULT_USER_ID) return process.env.DEFAULT_USER_ID

  // No owner identified — caller must decide how to handle
  return null
}

// Legacy alias kept for post_scheduled path
async function resolveUserIds(req, restaurantName) {
  const id = await resolveUserId(req, restaurantName)
  return id ? [id] : [null]
}

// ── Business hours helpers ────────────────────────────────────────────────────

function getLocalParts(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const get = type => parseInt(parts.find(p => p.type === type)?.value ?? '0')
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

function isWithinBizHours(date, bh) {
  if (!bh?.enabled) return true
  const tz = bh.timezone || 'America/New_York'
  const { hour, minute } = getLocalParts(date, tz)
  const [openH, openM] = (bh.open || '09:00').split(':').map(Number)
  const [closeH, closeM] = (bh.close || '21:00').split(':').map(Number)
  const nowMins = hour * 60 + minute
  return nowMins >= openH * 60 + openM && nowMins < closeH * 60 + closeM
}

// Returns a Date adjusted so it falls within business hours
function adjustForBizHours(date, bh) {
  if (!bh?.enabled || isWithinBizHours(date, bh)) return date

  const tz = bh.timezone || 'America/New_York'
  const [openH, openM] = (bh.open || '09:00').split(':').map(Number)
  const [closeH, closeM] = (bh.close || '21:00').split(':').map(Number)
  const { year, month, day, hour, minute } = getLocalParts(date, tz)
  const nowMins = hour * 60 + minute
  const closeMins = closeH * 60 + closeM

  // If after close, push to next calendar day
  const daysToAdd = nowMins >= closeMins ? 1 : 0

  // Build local target time string and parse as UTC, then correct for offset
  const jitter = Math.floor(Math.random() * 10) // 0–9 min offset so replies don't land on the dot
  const targetMinute = openM + jitter

  // We need to know the UTC offset at the target moment. Use Intl trick:
  const approxUtc = new Date(Date.UTC(year, month - 1, day + daysToAdd, openH, targetMinute, 0))
  const localCheck = getLocalParts(approxUtc, tz)
  const diffH = openH - localCheck.hour
  const diffM = targetMinute - localCheck.minute
  return new Date(approxUtc.getTime() + (diffH * 60 + diffM) * 60_000)
}

// Compute when a review reply should auto-post
function computeScheduledAt(replySpeed, bh) {
  if (!replySpeed || replySpeed === 'manual') return null
  const now = new Date()
  // Base delay in ms for each speed, with randomised jitter
  const jitterMs = (4 + Math.random() * 36) * 60_000 // 4–40 min
  const delays = {
    instant:    jitterMs,
    within_1h:  (30 + Math.random() * 60) * 60_000,   // 30–90 min
    within_4h:  (210 + Math.random() * 60) * 60_000,  // 3.5–4.5 h
    within_24h: (22 + Math.random() * 4) * 3_600_000, // 22–26 h
  }
  const delay = delays[replySpeed] ?? jitterMs
  const candidate = new Date(now.getTime() + delay)
  return adjustForBizHours(candidate, bh)
}


// ── Auto-reply cron: process queued reviews ───────────────────────────────────

async function processQueuedReplies() {
  if (!supabase) return
  const now = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('reviews')
    .select('id, user_id, ai_reply, review_id')
    .eq('status', 'replied')
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', now)
    .limit(20)

  if (error) { console.error('[AutoReply] Query error:', error.message); return }
  if (!due?.length) return

  console.log(`[AutoReply] Processing ${due.length} queued replies...`)

  for (const review of due) {
    try {
      // Check if user still has auto_post_enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_access_token, google_refresh_token, google_token_expires_at, google_account_id, google_location_id, auto_post_enabled, business_hours')
        .eq('id', review.user_id)
        .single()

      if (!profile?.auto_post_enabled) {
        // User turned off auto-post — clear the scheduled_at so we stop retrying
        await supabase.from('reviews').update({ scheduled_at: null }).eq('id', review.id)
        continue
      }

      if (!profile.google_refresh_token || !review.review_id) {
        await supabase.from('reviews').update({ scheduled_at: null }).eq('id', review.id)
        continue
      }

      // Double-check business hours at execution time
      if (!isWithinBizHours(new Date(), profile.business_hours)) {
        // Reschedule to next business hours window
        const next = adjustForBizHours(new Date(), profile.business_hours)
        await supabase.from('reviews').update({ scheduled_at: next.toISOString() }).eq('id', review.id)
        console.log(`[AutoReply] Review ${review.id} rescheduled to ${next.toISOString()} (outside biz hours)`)
        continue
      }

      const accessToken = await getValidAccessToken(profile)
      if (!accessToken) { console.error(`[AutoReply] Token refresh failed for review ${review.id}`); continue }

      const googleUrl = `https://mybusiness.googleapis.com/v4/accounts/${profile.google_account_id}/locations/${profile.google_location_id}/reviews/${review.review_id}/reply`

      const googleRes = await fetch(googleUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: review.ai_reply }),
      })

      if (googleRes.ok) {
        await supabase.from('reviews').update({ status: 'posted', scheduled_at: null }).eq('id', review.id)
        console.log(`[AutoReply] Review ${review.id} auto-posted to Google`)
      } else {
        const text = await googleRes.text()
        console.error(`[AutoReply] Google API error for review ${review.id} (${googleRes.status}):`, text)
      }
    } catch (err) {
      console.error(`[AutoReply] Exception for review ${review.id}:`, err.message)
    }
  }
}

// ── Cron schedules ────────────────────────────────────────────────────────────
// Auto-reply: every 2 minutes
cron.schedule('*/2 * * * *', processQueuedReplies)

// Uptime monitor: every hour — checks Vercel frontend + this backend, SMS if down
const ALERT_PHONE = process.env.OWNER_ALERT_PHONE || ''
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://getautopilot.net'

async function checkUptime() {
  const checks = [
    { name: 'Backend',  url: `${process.env.BACKEND_URL || 'https://autopilot-production-7671.up.railway.app'}/health` },
    { name: 'Frontend', url: FRONTEND_URL },
  ]
  const failed = []
  for (const { name, url } of checks) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) failed.push(`${name} returned ${res.status}`)
    } catch (err) {
      failed.push(`${name} is unreachable (${err.message})`)
    }
  }
  if (failed.length > 0) {
    const msg = `🚨 AutoPilot DOWN:\n${failed.join('\n')}\n\nCheck Railway + Vercel dashboards immediately.`
    console.error('[Uptime] ALERT:', msg)
    if (ALERT_PHONE) {
      try { await sendSms(ALERT_PHONE, msg) } catch (e) { console.error('[Uptime] SMS failed:', e.message) }
    }
  } else {
    console.log('[Uptime] All systems OK')
  }
}
cron.schedule('0 * * * *', checkUptime)   // top of every hour


// ── Webhook (Make.com) ────────────────────────────────────────────────────────
app.post('/api/webhook', webhookLimiter, async (req, res) => {
  // Verify shared secret so only Make.com can fire fake reviews into the system.
  // Set MAKE_WEBHOOK_SECRET in Railway env vars AND in your Make.com HTTP module
  // as the header: X-Webhook-Secret: <your-secret>
  const webhookSecret = process.env.MAKE_WEBHOOK_SECRET
  if (webhookSecret) {
    const provided = req.headers['x-webhook-secret']
    if (!provided || provided !== webhookSecret) {
      console.warn('[Webhook] Rejected — invalid or missing X-Webhook-Secret from', req.ip)
      logSecurityEvent('webhook_rejected', req, { reason: provided ? 'wrong_secret' : 'no_secret' }).catch?.(() => {})
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  console.log('Webhook received:', JSON.stringify(req.body, null, 2))

  const {
    type,
    customerName, customer_name,
    details, reviewText, review_text,
    aiReply, ai_reply, reply, response: replyResponse,
    timestamp, platform, phone, lastVisit, rating,
    review_id: reviewId,
  } = req.body

  if (!type) return res.status(400).json({ error: 'Missing required field: type' })

  // Accept snake_case or camelCase variants from Make.com
  const resolvedCustomerName = customerName || customer_name || ''
  const resolvedReviewText   = reviewText   || review_text   || details || ''
  const resolvedReply        = aiReply      || ai_reply      || reply   || replyResponse || ''

  const event = {
    id:           Date.now(),
    type:         clean(type, 80),
    customerName: clean(resolvedCustomerName, 200),
    details:      clean(details, 5000),
    reviewText:   clean(resolvedReviewText, 5000),
    aiReply:      clean(resolvedReply, 5000),
    timestamp:    timestamp    ?? new Date().toISOString(),
    receivedAt:   new Date().toISOString(),
    ...(platform  != null && { platform: clean(platform, 80) }),
    ...(phone     != null && { phone: clean(phone, 40) }),
    ...(lastVisit != null && { lastVisit: clean(lastVisit, 80) }),
    ...(rating    != null && { rating: Number(rating) }),
  }

  events.unshift(event)
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS

  if (supabase) {
    const webhookRestaurantName = req.body.restaurant_name ?? resolvedCustomerName ?? null

    if (type === 'review_replied') {
      const userIds = await resolveUserIds(req, webhookRestaurantName)
      const numericRating = rating != null && !Number.isNaN(Number(rating)) ? Number(rating) : null

      for (const userId of userIds) {
        // Load user prefs to compute scheduled_at
        let profile = null
        if (userId) {
          const { data } = await supabase
            .from('profiles')
            .select('auto_post_enabled, reply_speed, business_hours, notification_prefs')
            .eq('id', userId)
            .single()
          profile = data
        }

        const isManual = !profile?.auto_post_enabled || profile?.reply_speed === 'manual'
        const scheduledAt = (!isManual && resolvedReply)
          ? computeScheduledAt(profile.reply_speed, profile.business_hours)
          : null

        // Manual mode: save as 'pending' so the Approve button shows in the dashboard
        // Auto mode:   save as 'replied' so the cron picks it up and posts to Google
        const reviewStatus = resolvedReply
          ? (isManual ? 'pending' : 'replied')
          : 'pending'

        const reviewRow = {
          user_id:       userId,
          customer_name: clean(resolvedCustomerName, 200),
          review_text:   clean(resolvedReviewText, 5000),
          ai_reply:      clean(resolvedReply, 5000),
          rating:        numericRating,
          status:        reviewStatus,
          review_id:     reviewId ?? null,
          scheduled_at:  scheduledAt?.toISOString() ?? null,
        }

        let dbError
        if (reviewId) {
          // Upsert on external review_id so Make.com can update existing rows
          const { error: e } = await supabase
            .from('reviews')
            .upsert({ ...reviewRow, created_at: timestamp ?? new Date().toISOString() }, { onConflict: 'review_id' })
          dbError = e
        } else {
          const { error: e } = await supabase.from('reviews').insert({
            ...reviewRow,
            created_at: timestamp ?? new Date().toISOString(),
          })
          dbError = e
        }
        if (dbError) console.error('Supabase review upsert:', dbError.message)

        // Notify the restaurant owner of new review
        if (userId) {
          const { data: ownerProfile } = await supabase.from('profiles').select('notification_prefs').eq('id', userId).single()
          // email lives in auth.users, not profiles — fetch it via admin API
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
          const ownerEmail = authUser?.email
          const notif = ownerProfile?.notification_prefs ?? {}
          const stars = numericRating ? `${'⭐'.repeat(numericRating)} (${numericRating}/5)` : ''
          const preview = clean(resolvedReviewText, 120)
          if (ownerEmail && notif.email !== false) {
            sendEmail({
              to: ownerEmail,
              subject: `New ${numericRating <= 3 ? '⚠️' : '⭐'} review from ${clean(resolvedCustomerName, 60)}`,
              html: `<h2>New review received ${stars}</h2><p><strong>${clean(resolvedCustomerName, 100)}</strong> left a review:</p><blockquote>${preview}</blockquote>${resolvedReply ? `<p><strong>AI Reply ready:</strong> ${clean(resolvedReply, 300)}</p>` : ''}<p><a href="${process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'}/dashboard">View in dashboard →</a></p>`,
            })
          }
        }
      }
    }

    if (type === 'post_scheduled') {
      const userIds = await resolveUserIds(req, webhookRestaurantName)
      const rows = userIds.map(userId => ({
        user_id:     userId,
        type:        'post_scheduled',
        description: clean(platform ? `${platform}: ${details}` : details, 500),
        created_at:  timestamp ?? new Date().toISOString(),
      }))
      supabase.from('activity_feed').insert(rows)
        .then(({ error: e }) => { if (e) console.error('Supabase activity insert:', e.message) })
    }
  }

  pushToClients()
  res.json({ ok: true, event })
})

// GET /api/security-events — recent security events for the dashboard
app.get('/api/security-events', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('security_events')
    .select('id, type, ip, path, details, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET /api/events
app.get('/api/events', requireAuth, (_req, res) => res.json(events))

// GET /api/events/stream
app.get('/api/events/stream', requireAuth, (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  res.write(`data: ${JSON.stringify(events)}\n\n`)
  const clientId = Date.now() + Math.random()
  sseClients.set(clientId, res)
  req.on('close', () => sseClients.delete(clientId))
})

// POST /api/reviews/set-reply — Make.com (webhook secret) OR dashboard (Bearer token) can call this
app.post('/api/reviews/set-reply', async (req, res) => {
  const webhookSecret = process.env.MAKE_WEBHOOK_SECRET
  const providedSecret = req.headers['x-webhook-secret']
  const bearerToken = req.headers.authorization?.replace('Bearer ', '').trim()

  // Accept if: webhook secret matches, OR a valid Supabase JWT is present
  let authorized = false
  let jwtUser = null
  if (webhookSecret && providedSecret === webhookSecret) {
    authorized = true
  } else if (bearerToken && supabase) {
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken)
    if (!error && user) { authorized = true; jwtUser = user }
  }

  if (!authorized) {
    console.warn('[set-reply] Rejected — unauthorized from', req.ip)
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { review_id, id, ai_reply, aiReply, reply } = req.body
  const resolvedReply = ai_reply || aiReply || reply || ''
  if (!resolvedReply) return res.status(400).json({ error: 'ai_reply is required' })

  const cleanedReply = clean(resolvedReply, 5000)

  // When called via JWT (dashboard), verify ownership before updating
  let result
  if (review_id) {
    if (jwtUser) {
      const { data: existing } = await supabase.from('reviews').select('user_id').eq('review_id', review_id).single()
      if (existing && existing.user_id !== jwtUser.id) return res.status(403).json({ error: 'Forbidden' })
    }
    result = await supabase
      .from('reviews')
      .update({ ai_reply: cleanedReply, status: 'replied' })
      .eq('review_id', review_id)
  } else if (id) {
    if (jwtUser) {
      const { data: existing } = await supabase.from('reviews').select('user_id').eq('id', id).single()
      if (existing && existing.user_id !== jwtUser.id) return res.status(403).json({ error: 'Forbidden' })
    }
    result = await supabase
      .from('reviews')
      .update({ ai_reply: cleanedReply, status: 'replied' })
      .eq('id', id)
  } else {
    return res.status(400).json({ error: 'review_id or id is required' })
  }

  if (result.error) return res.status(500).json({ error: result.error.message })
  res.json({ ok: true })
})

// POST /api/reviews/:id/regenerate — generate a fresh AI reply for a review
app.post('/api/reviews/:id/regenerate', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { id } = req.params

  const { data: review, error: revErr } = await supabase
    .from('reviews')
    .select('user_id, review_text, rating')
    .eq('id', id).single()
  if (revErr || !review) return res.status(404).json({ error: 'Review not found' })
  if (review.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_name, reply_tone')
    .eq('id', review.user_id).single()

  const restaurantName = profile?.restaurant_name || 'the restaurant'
  const toneInstruction = profile?.reply_tone ? `\nPersonality & tone: ${profile.reply_tone}` : ''

  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' })

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages: [{ role: 'user', content: `You are managing Google reviews for a restaurant. The review has a star rating of ${review.rating} out of 5 stars. Write a warm, professional response.${toneInstruction}\nRestaurant name: ${restaurantName}\nReview: ${review.review_text}\nSign off with the restaurant name. Return only the reply text, nothing else.` }]
      })
    })
    const groqData = await groqRes.json()
    if (!groqRes.ok) return res.status(500).json({ error: 'Groq error', details: groqData })
    const newReply = groqData.choices?.[0]?.message?.content?.trim() || ''
    await supabase.from('reviews').update({ ai_reply: newReply }).eq('id', id)
    res.json({ ok: true, reply: newReply })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/reply
app.post('/api/reply', replyLimiter, requireAuth, async (req, res) => {
  const { id, reply } = req.body
  const cleanReply = clean(reply, 4000)
  if (!id || !cleanReply) return res.status(400).json({ error: 'id and reply are required' })
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { error } = await supabase
    .from('messages')
    .update({ reply: cleanReply, replied_at: new Date().toISOString(), status: 'replied' })
    .eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /api/generate-post-groq  (Groq/Llama — server-side proxy, key never exposed)
app.post('/api/generate-post-groq', generateLimiter, requireAuth, async (req, res) => {
  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })

  const topic    = clean(req.body.topic, 500)
  const platform = clean(req.body.platform, 50)
  const tone     = clean(req.body.tone, 50)
  if (!topic) return res.status(400).json({ error: 'topic is required' })

  const TONE_DESC = {
    friendly:     'Friendly & casual, warm and conversational',
    professional: 'Professional and polished, business-appropriate',
    energetic:    'Energetic and fun, lots of enthusiasm and personality',
  }
  const toneDesc = TONE_DESC[tone] ?? TONE_DESC.friendly
  const charHint = platform === 'Twitter' ? 'Keep it under 280 characters.' : 'Aim for 150–300 characters.'

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        messages: [
          { role: 'system', content: `You are a social media expert for independent restaurants. Write engaging, authentic posts that sound like a real restaurant owner wrote them — not a marketing agency. Be specific and include relevant emojis and 3-5 hashtags. Tone: ${toneDesc}.` },
          { role: 'user', content: `Write a ${platform} post about: ${topic.trim()}. ${charHint} Return only the post text, nothing else.` },
        ],
      }),
    })
    const data = await groqRes.json()
    if (!groqRes.ok) throw new Error(data.error?.message || `Groq API error ${groqRes.status}`)
    res.json({ text: data.choices[0].message.content.trim() })
  } catch (err) {
    console.error('Groq error:', err.message)
    res.status(500).json({ error: err.message ?? 'AI generation failed.' })
  }
})

// POST /api/discord/message  (Discord webhook proxy — URL never exposed to browser)
app.post('/api/discord/message', requireAuth, async (req, res) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL
  if (!webhookUrl) return res.status(500).json({ error: 'DISCORD_WEBHOOK_URL not configured on server.' })

  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' })

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: clean(content, 2000) }),
    })
    if (!discordRes.ok) throw new Error(`Discord returned ${discordRes.status}`)
    res.json({ ok: true })
  } catch (err) {
    console.error('Discord proxy error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/google/select-location  — save chosen location after multi-location picker
app.post('/api/auth/google/select-location', requireAuth, async (req, res) => {
  const { user_id, location_id } = req.body
  if (!user_id || !location_id) return res.status(400).json({ error: 'user_id and location_id are required' })
  if (user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  const { error } = await supabase
    .from('profiles')
    .update({ google_location_id: location_id })
    .eq('id', user_id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// Stripe price map
const PRICE_IDS = {
  starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY, yearly: process.env.STRIPE_PRICE_STARTER_YEARLY },
  growth:  { monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,  yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY  },
  pro:     { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,     yearly: process.env.STRIPE_PRICE_PRO_YEARLY     },
}

// POST /api/create-checkout-session
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })
  const { plan, interval, userId } = req.body
  if (!plan || !interval) return res.status(400).json({ error: 'plan and interval are required' })
  const priceId = PRICE_IDS[plan]?.[interval === 'yearly' ? 'yearly' : 'monthly']
  if (!priceId) return res.status(400).json({ error: 'Invalid plan or price not configured' })
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/payment-success`,
      cancel_url:  `${frontendUrl}/pricing`,
      client_reference_id: userId ?? undefined,
      metadata: { plan, interval, userId: userId ?? '' },
      subscription_data: { trial_period_days: 14 },
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/create-portal-session
app.post('/api/create-portal-session', requireAuth, async (req, res) => {
  if (!stripe || !supabase) return res.status(500).json({ error: 'Stripe or Supabase not configured' })
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })
  if (userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  const { data: profile, error } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  if (error || !profile?.stripe_customer_id) return res.status(404).json({ error: 'No Stripe customer found.' })
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'}/dashboard/subscription?portal_return=true`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reviews/:reviewId/approve
app.post('/api/reviews/:reviewId/approve', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { reviewId } = req.params

  const { data: review, error: reviewErr } = await supabase
    .from('reviews').select('user_id, ai_reply, review_id').eq('id', reviewId).single()
  if (reviewErr || !review) return res.status(404).json({ error: 'Review not found' })
  if (review.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  if (!review.ai_reply)   return res.status(400).json({ error: 'No AI reply to post' })
  if (!review.review_id)  return res.status(400).json({ error: 'Google review_id not stored' })

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_account_id, google_location_id')
    .eq('id', review.user_id).single()
  if (profileErr || !profile) return res.status(404).json({ error: 'Profile not found' })
  if (!profile.google_refresh_token) return res.status(400).json({ error: 'Google not connected' })

  let accessToken
  try { accessToken = await getValidAccessToken(profile) } catch (err) {
    return res.status(500).json({ error: `Token refresh failed: ${err.message}` })
  }
  if (!accessToken) return res.status(500).json({ error: 'Could not obtain Google access token' })

  const googleUrl = `https://mybusiness.googleapis.com/v4/accounts/${profile.google_account_id}/locations/${profile.google_location_id}/reviews/${review.review_id}/reply`

  let googleRes
  try {
    googleRes = await fetch(googleUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: review.ai_reply }),
    })
  } catch (err) {
    return res.status(502).json({ error: `Network error reaching Google: ${err.message}` })
  }

  if (!googleRes.ok) {
    const errText = await googleRes.text()
    console.error(`Google reply API error (${googleRes.status}):`, errText)
    return res.status(502).json({ error: `Google API error (${googleRes.status}): ${errText}` })
  }

  const { error: updateErr } = await supabase.from('reviews').update({ status: 'posted', scheduled_at: null }).eq('id', reviewId)
  if (updateErr) {
    console.error('Status update failed after posting to Google:', updateErr.message)
    return res.json({ ok: true, warning: 'Reply posted to Google but DB status update failed' })
  }

  console.log(`Review ${reviewId} approved and posted to Google.`)
  res.json({ ok: true })
})

// POST /api/test-review  — injects a fake review through the full pipeline for testing
// Usage: POST { user_id, rating, reviewer_name, review_text } — all optional, sensible defaults provided
app.post('/api/test-review', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })

  let {
    user_id,
    rating        = 5,
    reviewer_name = 'Test Customer',
    review_text   = 'Amazing food and incredible service! The pasta was perfectly cooked and the staff were so friendly. Will definitely be coming back!',
    review_id     = `test_${Date.now()}`,
  } = req.body

  if (!user_id) return res.status(400).json({ error: 'user_id is required' })
  if (user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  reviewer_name = clean(reviewer_name, 200)
  review_text   = clean(review_text, 5000)

  // Load user prefs
  const { data: profile } = await supabase
    .from('profiles')
    .select('auto_post_enabled, reply_speed, business_hours')
    .eq('id', user_id)
    .single()

  // Generate a fake AI reply based on rating
  const fakeReplies = {
    5: `Thank you so much for your wonderful review! We're thrilled you enjoyed your experience with us. Comments like yours make everything we do worthwhile. We look forward to welcoming you back soon! 🍝`,
    4: `Thank you for the kind words! We're so glad you had a great time and we hope to see you again soon.`,
    3: `Thank you for taking the time to share your feedback. We're glad parts of your visit were enjoyable, and we'll use your comments to keep improving. Hope to see you again!`,
    2: `We sincerely apologize your experience didn't meet expectations. We take all feedback seriously and would love the chance to make it right. Please reach out to us directly.`,
    1: `We're truly sorry to hear about your experience. This is not the standard we hold ourselves to. Please contact us directly so we can make this right for you.`,
  }
  const ai_reply = fakeReplies[Math.round(rating)] || fakeReplies[5]

  const isManual = !profile?.auto_post_enabled || profile?.reply_speed === 'manual'
  const scheduledAt = (!isManual)
    ? computeScheduledAt(profile?.reply_speed || 'instant', profile?.business_hours)
    : null

  const reviewRow = {
    user_id,
    customer_name: reviewer_name,
    review_text,
    ai_reply,
    rating:        Number(rating),
    status:        isManual ? 'pending' : 'replied',
    review_id,
    scheduled_at:  scheduledAt?.toISOString() ?? null,
    created_at:    new Date().toISOString(),
  }

  const { data, error } = await supabase.from('reviews').insert(reviewRow).select().single()
  if (error) return res.status(500).json({ error: error.message })

  // Push to SSE so the dashboard updates instantly without a refresh
  const sseEvent = {
    id:           Date.now(),
    type:         'review_replied',
    customerName: reviewer_name,
    reviewText:   review_text,
    aiReply:      ai_reply,
    rating:       Number(rating),
    timestamp:    new Date().toISOString(),
    receivedAt:   new Date().toISOString(),
  }
  events.unshift(sseEvent)
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS
  pushToClients()

  console.log(`[TestReview] Injected fake review for user ${user_id} — status: ${reviewRow.status}`)

  // Send email notification to the owner (mirrors webhook handler logic)
  try {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('notification_prefs, restaurant_name')
      .eq('id', user_id)
      .single()
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id)
    const ownerEmail = authUser?.email
    const notif = ownerProfile?.notification_prefs ?? {}
    const stars = `${'⭐'.repeat(Number(rating))} (${rating}/5)`
    const restName = ownerProfile?.restaurant_name || 'your restaurant'
    const frontendUrl = process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'
    if (ownerEmail && notif.email !== false) {
      await sendEmail({
        to: ownerEmail,
        subject: `[TEST] New review from ${escHtml(reviewer_name)} — ${escHtml(restName)}`,
        html: `
          <h2>🧪 Test Review — ${escHtml(stars)}</h2>
          <p><strong>${escHtml(reviewer_name)}</strong> left a review for <strong>${escHtml(restName)}</strong>:</p>
          <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${escHtml(review_text)}</blockquote>
          <p><strong>AI Reply ready:</strong><br>${escHtml(ai_reply)}</p>
          <p><a href="${frontendUrl}/dashboard/reviews" style="background:#000;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">View in Dashboard →</a></p>
          <p style="color:#888;font-size:12px;margin-top:20px">This is a test review injected via the AutoPilot /api/test-review endpoint. No actual Google review was posted.</p>
        `,
      })
      console.log(`[TestReview] Email sent to ${ownerEmail}`)
    } else {
      console.log(`[TestReview] Email skipped — ownerEmail=${ownerEmail}, notif.email=${notif.email}`)
    }
  } catch (emailErr) {
    console.warn('[TestReview] Email notification failed:', emailErr.message)
  }

  res.json({ ok: true, review: data, status: reviewRow.status, scheduled_at: reviewRow.scheduled_at })
})

// POST /api/test-email — quick diagnostic, returns full Resend response or error
app.post('/api/test-email', requireAuth, async (req, res) => {
  // Only allow sending to the authenticated user's own email — prevents using this as a free spam tool
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(req.user.id)
  const to = authUser?.email
  if (!to) return res.status(400).json({ error: 'Could not resolve your email address' })
  if (!resend) return res.status(500).json({ error: 'RESEND_API_KEY not set in Railway env vars' })
  const from = buildFromAddress()
  console.log(`[TestEmail] Attempting send → from: ${from} → to: ${to}`)
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'AutoPilot — email delivery test',
    html: emailHtml(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111">Email is working! ✅</h2>
      <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.5">
        Your AutoPilot email notifications are configured and delivering correctly.
        From address: <strong>${from}</strong>
      </p>
      <p style="margin:0;font-size:13px;color:#888">Sent at ${new Date().toISOString()}</p>
    `),
  })
  if (error) {
    console.error('[TestEmail] Resend error:', JSON.stringify(error))
    return res.status(500).json({ ok: false, error, from, to })
  }
  console.log('[TestEmail] Success — id:', data?.id)
  res.json({ ok: true, id: data?.id, from, to })
})

// POST /api/smoke-test
app.post('/api/smoke-test', requireAuth, async (req, res) => {
  // Restrict to owner's own email and configured alert phone — prevents abuse
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(req.user.id)
  const email = authUser?.email
  const phone = process.env.OWNER_ALERT_PHONE || null
  if (!phone && !email) return res.status(400).json({ error: 'No alert phone or email configured' })
  const results = {}
  if (phone) {
    try {
      const smsInfo = await sendSms(phone, 'AutoPilot smoke test SMS is working!')
      results.sms = smsInfo
    } catch (err) {
      results.sms = `failed: ${err.message}`
    }
  }
  if (email) {
    try {
      await sendEmail({ to: email, subject: 'AutoPilot Smoke Test', html: '<h2>Email is working!</h2><p>AutoPilot email pipeline confirmed.</p>' })
      results.email = 'sent'
    } catch (err) {
      results.email = `failed: ${err.message}`
    }
  }
  res.json({ ok: true, results })
})

// Global error handler — catches unhandled throws in async route handlers
// Never expose stack traces to the client
app.use((err, req, res, _next) => {
  console.error('[UnhandledError]', err.message, err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server -> http://0.0.0.0:${PORT}`)
  startReviewsPoller()
})
