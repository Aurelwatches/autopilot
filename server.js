import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const app = express()
const PORT = process.env.PORT || 3001

// Behind Railway's proxy — trust the first proxy hop so req.ip is the real client IP
// (needed for accurate rate limiting).
app.set('trust proxy', 1)

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// CORS — allow Netlify frontend to call Railway API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

// ── Stripe webhook — raw body required for signature verification ──────────────
// Must be registered BEFORE express.json() so the body isn't pre-parsed.
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body)
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id || session.metadata?.userId

    if (userId && supabase) {
      const { error } = await supabase.from('profiles').update({
        plan: session.metadata?.plan,
        plan_interval: session.metadata?.interval,
        subscribed_at: new Date().toISOString(),
        subscription_status: 'active',
      }).eq('id', userId)

      if (error) console.error('Supabase profile update error:', error.message)
      else console.log(`Activated subscription for user ${userId}, plan: ${session.metadata?.plan}`)
    }
  }

  res.json({ received: true })
})

app.use(express.json({ limit: '100kb' }))

// ── Security helpers ────────────────────────────────────────────────────────

// Dependency-free in-memory rate limiter (per client IP, fixed window).
// Fine for a single-instance deploy; swap for a shared store if scaling out.
function rateLimit({ windowMs, max }) {
  const hits = new Map() // ip -> { count, resetAt }
  // Periodically drop expired buckets so the map doesn't grow unbounded.
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
      return res.status(429).json({ error: 'Too many requests. Please slow down.' })
    }
    next()
  }
}

const webhookLimiter = rateLimit({ windowMs: 60_000, max: 100 }) // 100 requests / minute
const replyLimiter   = rateLimit({ windowMs: 60_000, max: 100 })

// Sanitize untrusted string input before persisting: drop null bytes, strip HTML
// tags, trim, and cap length. React escapes on render, but we never want raw
// markup or oversized payloads landing in the database.
function clean(v, maxLen = 5000) {
  if (v == null) return ''
  return String(v)
    .replace(/\u0000/g, '')
    .replace(/<\/?[^>]*>/g, '')
    .trim()
    .slice(0, maxLen)
}

// Log every incoming request so we can diagnose routing issues in production
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check — Railway uses this to confirm the server is up
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// In-memory ring buffer — newest first, capped at 50
const events = []
const MAX_EVENTS = 50

// SSE client registry
const sseClients = new Map()

function pushToClients() {
  const payload = `data: ${JSON.stringify(events)}\n\n`
  sseClients.forEach(res => res.write(payload))
}

// Look up user_id from profiles table by restaurant name (for webhook inserts)
async function getUserId(restaurantName) {
  if (!supabase || !restaurantName) return null
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('restaurant_name', restaurantName.trim())
    .limit(1)
    .single()
  return data?.id ?? null
}

// Decide which user(s) a webhook belongs to. Priority:
//   1. Explicit user_id from the personalized webhook URL (?user_id=...) or body
//   2. Look up the owner by restaurant name
//   3. Fallback so data is never lost: a configured default test account
//      (DEFAULT_USER_ID), otherwise fan out to every active user
// Always returns a non-empty array (worst case [null] → legacy insert with no owner).
async function resolveUserIds(req, restaurantName) {
  const explicit = req.query.user_id ?? req.body.user_id
  if (explicit) return [explicit]

  const byName = await getUserId(restaurantName)
  if (byName) return [byName]

  if (process.env.DEFAULT_USER_ID) return [process.env.DEFAULT_USER_ID]

  if (supabase) {
    const { data } = await supabase.from('profiles').select('id')
    if (data?.length) return data.map(r => r.id)
  }
  return [null]
}

// POST /api/webhook — called by Make.com (rate limited: 100 req/min per IP)
app.post('/api/webhook', webhookLimiter, async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2))
  console.log('Webhook fields present:', Object.keys(req.body))

  const {
    type, customerName, details, reviewText, aiReply,
    timestamp, platform, phone, lastVisit, rating,
  } = req.body

  if (!type) {
    return res.status(400).json({ error: 'Missing required field: type' })
  }

  // Store every field that arrives — nothing is dropped
  const event = {
    id:           Date.now(),
    type:         clean(type, 80),
    customerName: clean(customerName, 200),
    details:      clean(details, 5000),
    reviewText:   clean(reviewText, 5000),
    aiReply:      clean(aiReply, 5000),
    timestamp:    timestamp    ?? new Date().toISOString(),
    receivedAt:   new Date().toISOString(),
    ...(platform  != null && { platform: clean(platform, 80) }),
    ...(phone     != null && { phone: clean(phone, 40) }),
    ...(lastVisit != null && { lastVisit: clean(lastVisit, 80) }),
    ...(rating    != null && { rating: Number(rating) }),
  }

  console.log('Stored event:', JSON.stringify(event, null, 2))

  events.unshift(event)
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS

  // Persist to Supabase with user_id lookup
  if (supabase) {
    // The webhook payload should include restaurant_name so we can look up the owner
    const webhookRestaurantName = req.body.restaurant_name ?? customerName ?? null

    if (type === 'review_replied') {
      resolveUserIds(req, webhookRestaurantName).then(userIds => {
        const rows = userIds.map(userId => ({
          user_id:       userId,
          customer_name: clean(customerName, 200),
          review_text:   clean(reviewText ?? details, 5000),
          ai_reply:      clean(aiReply, 5000),
          rating:        rating != null && !Number.isNaN(Number(rating)) ? Number(rating) : null,
          status:        'replied',
          created_at:    timestamp  ?? new Date().toISOString(),
        }))
        supabase.from('reviews').insert(rows)
          .then(({ error: e }) => { if (e) console.error('Supabase review insert:', e.message) })
      })
    }

    if (type === 'post_scheduled') {
      resolveUserIds(req, webhookRestaurantName).then(userIds => {
        const rows = userIds.map(userId => ({
          user_id:     userId,
          type:        'post_scheduled',
          // activity_feed column is 'description' (no 'details'/'platform' columns exist)
          description: clean(platform ? `${platform}: ${details}` : details, 500),
          created_at:  timestamp ?? new Date().toISOString(),
        }))
        supabase.from('activity_feed').insert(rows)
          .then(({ error: e }) => { if (e) console.error('Supabase activity insert:', e.message) })
      })
    }
  }

  pushToClients()
  res.json({ ok: true, event })
})

// GET /api/events — one-time snapshot (used as SSE fallback)
app.get('/api/events', (_req, res) => {
  res.json(events)
})

// GET /api/events/stream — SSE stream; pushes full event array on every webhook
app.get('/api/events/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable nginx buffering
  res.flushHeaders()

  // Send current state immediately so the page doesn't wait for first event
  res.write(`data: ${JSON.stringify(events)}\n\n`)

  const clientId = Date.now() + Math.random()
  sseClients.set(clientId, res)
  req.on('close', () => sseClients.delete(clientId))
})

// POST /api/reply — called by Make.com to deliver a support reply (rate limited)
app.post('/api/reply', replyLimiter, async (req, res) => {
  const { id, reply } = req.body
  const cleanReply = clean(reply, 4000)
  if (!id || !cleanReply) {
    return res.status(400).json({ error: 'id and reply are required' })
  }
  if (!supabase) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not configured' })
  }
  const { error } = await supabase
    .from('messages')
    .update({ reply: cleanReply, replied_at: new Date().toISOString(), status: 'replied' })
    .eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /api/generate-post — AI-powered social post generation
app.post('/api/generate-post', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Add it to your .env file and restart the server.',
    })
  }

  const { topic, platform } = req.body
  if (!topic?.trim()) return res.status(400).json({ error: 'topic is required' })

  const charHint = platform === 'Twitter'
    ? 'Keep it under 280 characters.'
    : 'Aim for 150–300 characters.'

  try {
    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: "You are a social media expert for independent restaurants. Write engaging, authentic posts that sound like a real restaurant owner wrote them — not a marketing agency. Be specific, warm, and conversational. Include relevant emojis and 3-5 hashtags.",
      messages: [{
        role: 'user',
        content: `Write a ${platform} post about: ${topic.trim()}. ${charHint} Return only the post text, nothing else.`,
      }],
    })
    res.json({ text: msg.content[0].text.trim() })
  } catch (err) {
    console.error('Anthropic error:', err.message)
    res.status(500).json({ error: err.message ?? 'AI generation failed.' })
  }
})

// Map plan + interval → configured Stripe Price ID
const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY
  }
};

// POST /api/create-checkout-session — create a Stripe hosted checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })

  const { plan, interval, userId } = req.body
  if (!plan || !interval) return res.status(400).json({ error: 'plan and interval are required' })

  const priceKey = interval === 'yearly' ? 'yearly' : 'monthly'
  const priceId = PRICE_IDS[plan]?.[priceKey]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan or interval, or price not configured' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: 'https://autopilot-pink.vercel.app/payment-success',
      cancel_url: 'https://autopilot-pink.vercel.app/pricing',
      client_reference_id: userId ?? undefined,
      metadata: { plan, interval, userId: userId ?? '' },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server → http://0.0.0.0:${PORT}`)
})
