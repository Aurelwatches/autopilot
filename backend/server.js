import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
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
  if (!twilioClient) return console.warn('[SMS] Twilio not configured')
  try {
    const msg = await twilioClient.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body })
    console.log('[SMS] Sent:', msg.sid)
  } catch (err) {
    console.error('[SMS] Error:', err.message)
  }
}

async function sendEmail({ to, subject, html }) {
  if (!resend) return console.warn('[Email] Resend not configured')
  try {
    const { data, error } = await resend.emails.send({ from: process.env.EMAIL_FROM || 'onboarding@resend.dev', to, subject, html })
    if (error) console.error('[Email] Error:', error)
    else console.log('[Email] Sent:', data?.id)
  } catch (err) {
    console.error('[Email] Error:', err.message)
  }
}

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

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
      const { data: profile, error } = await supabase.from('profiles').update({
        plan,
        plan_interval: interval,
        subscribed_at: new Date().toISOString(),
        subscription_status: 'active',
        stripe_customer_id: session.customer ?? null,
      }).eq('id', userId).select('email, restaurant_name, phone').single()
      if (error) console.error('Supabase profile update error:', error.message)
      // Notify the new subscriber
      if (profile?.email) {
        sendEmail({
          to: profile.email,
          subject: '🎉 Welcome to AutoPilot!',
          html: `<h2>You're in!</h2><p>Your <strong>${plan}</strong> plan is now active. Head to your <a href="https://autopilot-pink.vercel.app/dashboard">dashboard</a> to get started.</p><p>Your 14-day free trial has started — you won't be charged until it ends.</p>`,
        })
      }
      if (profile?.phone) {
        sendSms(profile.phone, `Welcome to AutoPilot! Your ${plan} plan is live. 14-day free trial started — you won't be charged until it ends. autopilot-pink.vercel.app/dashboard`)
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
      const { error } = await supabase.from('profiles')
        .update({ subscription_status: newStatus })
        .eq('stripe_customer_id', sub.customer)
      if (error) console.error('[Stripe] subscription.updated failed:', error.message)
      else console.log(`[Stripe] subscription updated → ${newStatus} for customer`, sub.customer)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const customerId = event.data.object.customer
    if (customerId && supabase) {
      const { data: profile, error } = await supabase.from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
        .select('email, phone, restaurant_name')
        .single()
      if (error) console.error('[Stripe] payment_failed update failed:', error.message)
      else {
        console.log('[Stripe] payment failed for customer', customerId)
        if (profile?.email) {
          sendEmail({
            to: profile.email,
            subject: 'Action required: AutoPilot payment failed',
            html: `<h2>Payment failed</h2><p>We couldn't process your AutoPilot subscription payment. Please update your billing info to keep your account active.</p><p><a href="https://autopilot-pink.vercel.app/dashboard/subscription">Update billing →</a></p>`,
          })
        }
        if (profile?.phone) {
          sendSms(profile.phone, 'AutoPilot: Your payment failed. Update your billing info to keep your account active: autopilot-pink.vercel.app/dashboard/subscription')
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
      return res.status(429).json({ error: 'Too many requests.' })
    }
    next()
  }
}

const webhookLimiter = rateLimit({ windowMs: 60_000, max: 100 })
const replyLimiter   = rateLimit({ windowMs: 60_000, max: 100 })

function clean(v, maxLen = 5000) {
  if (v == null) return ''
  return String(v).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/<\/?[^>]*>/g, '').trim().slice(0, maxLen)
}

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

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
  return new Date(approxUtc.getTime() - (diffH * 60 + diffM) * 60_000)
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
    .eq('status', 'pending')
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


// ── Webhook (Make.com) ────────────────────────────────────────────────────────
app.post('/api/webhook', webhookLimiter, async (req, res) => {
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

        const scheduledAt = (profile?.auto_post_enabled && profile?.reply_speed !== 'manual')
          ? computeScheduledAt(profile.reply_speed, profile.business_hours)
          : null

        const reviewRow = {
          user_id:       userId,
          customer_name: clean(resolvedCustomerName, 200),
          review_text:   clean(resolvedReviewText, 5000),
          ai_reply:      clean(resolvedReply, 5000),
          rating:        numericRating,
          status:        resolvedReply ? 'replied' : 'pending',
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
          const { data: ownerProfile } = await supabase.from('profiles').select('email, phone, notification_prefs').eq('id', userId).single()
          const notif = ownerProfile?.notification_prefs ?? {}
          const stars = numericRating ? `${'⭐'.repeat(numericRating)} (${numericRating}/5)` : ''
          const preview = clean(resolvedReviewText, 120)
          if (ownerProfile?.email && notif.email !== false) {
            sendEmail({
              to: ownerProfile.email,
              subject: `New ${numericRating <= 3 ? '⚠️' : '⭐'} review from ${clean(resolvedCustomerName, 60)}`,
              html: `<h2>New review received ${stars}</h2><p><strong>${clean(resolvedCustomerName, 100)}</strong> left a review:</p><blockquote>${preview}</blockquote>${resolvedReply ? `<p><strong>AI Reply ready:</strong> ${clean(resolvedReply, 300)}</p>` : ''}<p><a href="https://autopilot-pink.vercel.app/dashboard">View in dashboard →</a></p>`,
            })
          }
          if (ownerProfile?.phone && notif.sms !== false) {
            sendSms(ownerProfile.phone, `AutoPilot: New ${stars} review from ${clean(resolvedCustomerName, 40)}. "${preview.slice(0, 80)}..." — autopilot-pink.vercel.app/dashboard`)
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

// GET /api/events
app.get('/api/events', (_req, res) => res.json(events))

// GET /api/events/stream
app.get('/api/events/stream', (req, res) => {
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

// POST /api/reviews/set-reply — Make.com calls this to write ai_reply back to a review row
app.post('/api/reviews/set-reply', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { review_id, id, ai_reply, aiReply, reply } = req.body
  const resolvedReply = ai_reply || aiReply || reply || ''
  if (!resolvedReply) return res.status(400).json({ error: 'ai_reply is required' })

  const cleanedReply = clean(resolvedReply, 5000)

  let result
  if (review_id) {
    result = await supabase
      .from('reviews')
      .update({ ai_reply: cleanedReply, status: 'replied' })
      .eq('review_id', review_id)
  } else if (id) {
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

// POST /api/reply
app.post('/api/reply', replyLimiter, async (req, res) => {
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

// POST /api/generate-post  (Anthropic — used by legacy callers)
app.post('/api/generate-post', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set.' })

  const { topic, platform, tone } = req.body
  if (!topic?.trim()) return res.status(400).json({ error: 'topic is required' })

  const charHint = platform === 'Twitter' ? 'Keep it under 280 characters.' : 'Aim for 150–300 characters.'

  try {
    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: "You are a social media expert for independent restaurants. Write engaging, authentic posts that sound like a real restaurant owner — not a marketing agency. Be specific, warm, and conversational. Include relevant emojis and 3-5 hashtags.",
      messages: [{ role: 'user', content: `Write a ${platform} post about: ${topic.trim()}. ${charHint} Return only the post text.` }],
    })
    res.json({ text: msg.content[0].text.trim() })
  } catch (err) {
    console.error('Anthropic error:', err.message)
    res.status(500).json({ error: err.message ?? 'AI generation failed.' })
  }
})

// POST /api/generate-post-groq  (Groq/Llama — server-side proxy, key never exposed)
app.post('/api/generate-post-groq', async (req, res) => {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })

  const { topic, platform, tone } = req.body
  if (!topic?.trim()) return res.status(400).json({ error: 'topic is required' })

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
app.post('/api/discord/message', async (req, res) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
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

// Stripe price map
const PRICE_IDS = {
  starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY, yearly: process.env.STRIPE_PRICE_STARTER_YEARLY },
  growth:  { monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,  yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY  },
  pro:     { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,     yearly: process.env.STRIPE_PRICE_PRO_YEARLY     },
}

// POST /api/create-checkout-session
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })
  const { plan, interval, userId } = req.body
  if (!plan || !interval) return res.status(400).json({ error: 'plan and interval are required' })
  const priceId = PRICE_IDS[plan]?.[interval === 'yearly' ? 'yearly' : 'monthly']
  if (!priceId) return res.status(400).json({ error: 'Invalid plan or price not configured' })
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://autopilot-pink.vercel.app/payment-success',
      cancel_url:  'https://autopilot-pink.vercel.app/pricing',
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
app.post('/api/create-portal-session', async (req, res) => {
  if (!stripe || !supabase) return res.status(500).json({ error: 'Stripe or Supabase not configured' })
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })
  const { data: profile, error } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  if (error || !profile?.stripe_customer_id) return res.status(404).json({ error: 'No Stripe customer found.' })
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app'}/dashboard/subscription`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reviews/:reviewId/approve — manual approve
app.post('/api/reviews/:reviewId/approve', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' })
  const { reviewId } = req.params

  const { data: review, error: reviewErr } = await supabase
    .from('reviews').select('user_id, ai_reply, review_id').eq('id', reviewId).single()
  if (reviewErr || !review) return res.status(404).json({ error: 'Review not found' })
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


// ─── Smoke test ──────────────────────────────────────────────────────────────
app.post('/api/smoke-test', async (req, res) => {
  const { phone, email } = req.body
  if (!phone && !email) return res.status(400).json({ error: 'Provide phone and/or email' })
  const results = {}
  if (phone) {
    try {
      await sendSms(phone, 'AutoPilot smoke test ✅ SMS is working!')
      results.sms = 'sent'
    } catch (err) {
      results.sms = `failed: ${err.message}`
    }
  }
  if (email) {
    try {
      await sendEmail({ to: email, subject: 'AutoPilot Smoke Test', html: '<h2>✅ Email is working!</h2><p>AutoPilot email pipeline confirmed.</p>' })
      results.email = 'sent'
    } catch (err) {
      results.email = `failed: ${err.message}`
    }
  }
  res.json({ ok: true, results })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server → http://0.0.0.0:${PORT}`)
  startReviewsPoller()
})
