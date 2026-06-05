import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

app.use(express.json())

// Log every incoming request so we can diagnose routing issues in production
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
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

// POST /api/webhook — called by Make.com
app.post('/api/webhook', async (req, res) => {
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
    type,
    customerName: customerName ?? '',
    details:      details      ?? '',
    reviewText:   reviewText   ?? '',
    aiReply:      aiReply      ?? '',
    timestamp:    timestamp    ?? new Date().toISOString(),
    receivedAt:   new Date().toISOString(),
    ...(platform  != null && { platform }),
    ...(phone     != null && { phone }),
    ...(lastVisit != null && { lastVisit }),
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
      getUserId(webhookRestaurantName).then(userId => {
        supabase.from('reviews').insert({
          user_id:       userId,
          customer_name: customerName ?? '',
          review_text:   reviewText ?? details ?? '',
          ai_reply:      aiReply    ?? '',
          rating:        rating != null ? Number(rating) : null,
          status:        'replied',
          created_at:    timestamp  ?? new Date().toISOString(),
        }).then(({ error: e }) => { if (e) console.error('Supabase review insert:', e.message) })
      })
    }

    if (type === 'post_scheduled') {
      getUserId(webhookRestaurantName).then(userId => {
        supabase.from('activity_feed').insert({
          user_id:    userId,
          type:       'post_scheduled',
          details:    details  ?? '',
          platform:   platform ?? null,
          created_at: timestamp ?? new Date().toISOString(),
        }).then(({ error: e }) => { if (e) console.error('Supabase activity insert:', e.message) })
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

// POST /api/reply — called by Make.com to deliver a support reply
app.post('/api/reply', async (req, res) => {
  const { id, reply } = req.body
  if (!id || !reply?.trim()) {
    return res.status(400).json({ error: 'id and reply are required' })
  }
  if (!supabase) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not configured' })
  }
  const { error } = await supabase
    .from('messages')
    .update({ reply: reply.trim(), replied_at: new Date().toISOString(), status: 'replied' })
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

app.listen(PORT, () => {
  console.log(`API server → http://localhost:${PORT}`)
})
