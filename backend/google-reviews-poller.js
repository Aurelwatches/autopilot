// google-reviews-poller.js
// Polls Google Business Profile for every AutoPilot client, finds unanswered
// reviews, generates AI replies via Groq, saves to Supabase, and notifies Discord.
// No Make.com dependency — runs entirely within Railway.

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildFromAddress() {
  const raw = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  return raw.includes('<') ? raw : `AutoPilot <${raw}>`;
}

function emailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#ffffff">Auto<span style="color:#22d3ee">Pilot</span></span>
          </td>
        </tr>
        <tr><td style="padding:32px">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #f0f0f0">
            <p style="margin:0;font-size:11px;color:#9ca3af">AutoPilot — AI-powered review management for restaurants.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOwnerEmail(userId, restaurantName, reviewerName, starRating, reviewText, aiReply) {
  if (!resend) return;
  try {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const ownerEmail = authUser?.email;
    if (!ownerEmail) return;

    const { data: profile } = await supabase.from('profiles').select('notification_prefs').eq('id', userId).single();
    if (profile?.notification_prefs?.email === false) return;

    const stars = '⭐'.repeat(Number(starRating) || 0);
    const frontendUrl = process.env.FRONTEND_URL || 'https://autopilot-pink.vercel.app';
    const from = buildFromAddress();

    const { data, error } = await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `New ${starRating}★ review from ${reviewerName} — ${restaurantName}`,
      html: emailHtml(`
        <h2 style="margin:0 0 4px;font-size:20px;color:#111">${stars} New Review</h2>
        <p style="margin:0 0 20px;font-size:13px;color:#888">${starRating}/5 stars · ${restaurantName}</p>
        <p style="margin:0 0 8px;font-size:15px;color:#374151"><strong>${reviewerName}</strong> wrote:</p>
        <blockquote style="margin:0 0 20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #22d3ee;border-radius:0 8px 8px 0;color:#555;font-size:14px;line-height:1.6">${reviewText || '(no text left)'}</blockquote>
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em">AI Reply Ready</p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;padding:14px 16px;background:#f0fdf4;border-radius:8px">${aiReply || '(none generated)'}</p>
        <a href="${frontendUrl}/dashboard/reviews" style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View in Dashboard →</a>
      `),
    });

    if (error) {
      console.error(`[Poller] Email send failed for ${ownerEmail}:`, JSON.stringify(error));
    } else {
      console.log(`[Poller] Email sent → ${ownerEmail} (id: ${data?.id})`);
    }
  } catch (err) {
    console.warn('[Poller] Email notification failed:', err.message);
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export async function refreshGoogleToken(client) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: client.google_refresh_token,
      grant_type:    'refresh_token'
    })
  });

  const data = await response.json();
  if (!data.access_token) {
    console.error(`Failed to refresh token for client ${client.id}:`, data);
    return null;
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await supabase.from('profiles').update({
    google_access_token:    data.access_token,
    google_token_expires_at: expiresAt
  }).eq('id', client.id);

  return data.access_token;
}

export async function getValidAccessToken(client) {
  const expiresAt = new Date(client.google_token_expires_at);
  const bufferMs  = 5 * 60 * 1000;
  if (!client.google_token_expires_at || (expiresAt.getTime() - Date.now()) < bufferMs) {
    return await refreshGoogleToken(client);
  }
  return client.google_access_token;
}

// ── Business hours helpers (mirrors server.js) ────────────────────────────────

function getLocalParts(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = type => parseInt(parts.find(p => p.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

function isWithinBizHours(date, bh) {
  if (!bh?.enabled) return true;
  const tz = bh.timezone || 'America/New_York';
  const { hour, minute } = getLocalParts(date, tz);
  const [openH, openM]   = (bh.open  || '09:00').split(':').map(Number);
  const [closeH, closeM] = (bh.close || '21:00').split(':').map(Number);
  const nowMins = hour * 60 + minute;
  return nowMins >= openH * 60 + openM && nowMins < closeH * 60 + closeM;
}

function adjustForBizHours(date, bh) {
  if (!bh?.enabled || isWithinBizHours(date, bh)) return date;
  const tz = bh.timezone || 'America/New_York';
  const [openH, openM]   = (bh.open  || '09:00').split(':').map(Number);
  const [closeH, closeM] = (bh.close || '21:00').split(':').map(Number);
  const { year, month, day, hour, minute } = getLocalParts(date, tz);
  const closeMins  = closeH * 60 + closeM;
  const nowMins    = hour * 60 + minute;
  const daysToAdd  = nowMins >= closeMins ? 1 : 0;
  const jitter     = Math.floor(Math.random() * 10);
  const targetMin  = openM + jitter;
  const approxUtc  = new Date(Date.UTC(year, month - 1, day + daysToAdd, openH, targetMin, 0));
  const localCheck = getLocalParts(approxUtc, tz);
  const diffH = openH - localCheck.hour;
  const diffM = targetMin - localCheck.minute;
  return new Date(approxUtc.getTime() + (diffH * 60 + diffM) * 60_000);
}

function computeScheduledAt(replySpeed, bh) {
  if (!replySpeed || replySpeed === 'manual') return null;
  const jitterMs = (4 + Math.random() * 36) * 60_000;
  const delays = {
    instant:    jitterMs,
    within_1h:  (30 + Math.random() * 60)  * 60_000,
    within_4h:  (210 + Math.random() * 60) * 60_000,
    within_24h: (22 + Math.random() * 4)   * 3_600_000,
  };
  const candidate = new Date(Date.now() + (delays[replySpeed] ?? jitterMs));
  return adjustForBizHours(candidate, bh);
}

// ── Groq reply generation ─────────────────────────────────────────────────────

async function generateReply(reviewText, starRating, restaurantName, replyTone) {
  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!groqKey) {
    console.warn('[Poller] GROQ_API_KEY not set — skipping AI reply generation');
    return null;
  }

  const ratingNum = typeof starRating === 'string'
    ? { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[starRating] ?? parseInt(starRating) ?? 5
    : starRating;

  const toneInstruction = replyTone
    ? `\nPersonality & tone for this restaurant: ${replyTone}`
    : '';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are managing Google reviews for a restaurant. The review has a star rating of ${ratingNum} out of 5 stars. If the rating is 4 or 5 stars write a warm enthusiastic thankful response. If the rating is 3 stars write a balanced response acknowledging both positives and areas for improvement. If the rating is 1 or 2 stars write a sincere apologetic response and offer to make things right.${toneInstruction}\nRestaurant name: ${restaurantName}\nReview: ${reviewText || '(no text left)'}\nSign off with the restaurant name. Return only the reply text, nothing else.`
        }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Groq ${res.status}`);
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[Poller] Groq error:', err.message);
    return null;
  }
}

// ── Discord notification ──────────────────────────────────────────────────────

async function notifyDiscord(restaurantName, reviewerName, starRating, reviewText, aiReply) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const stars = typeof starRating === 'string'
    ? { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[starRating] ?? starRating
    : starRating;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **New Review — ${restaurantName}**\n👤 ${reviewerName}  ·  ${'⭐'.repeat(Number(stars) || 0)}\n💬 ${reviewText || '(no text)'}\n🤖 **AI Reply:** ${aiReply || '(none generated)'}`
      })
    });
  } catch (err) {
    console.warn('[Poller] Discord notify failed:', err.message);
  }
}

// ── Google Reviews fetch ──────────────────────────────────────────────────────

async function getReviews(accessToken, googleAccountId, googleLocationId) {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${googleAccountId}/locations/${googleLocationId}/reviews`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google API error (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data.reviews || [];
}

// ── Main poll loop ────────────────────────────────────────────────────────────

async function pollAllClients() {
  console.log(`[${new Date().toISOString()}] Starting review poll...`);

  const { data: clients, error } = await supabase
    .from('profiles')
    .select('id, restaurant_name, google_access_token, google_refresh_token, google_token_expires_at, google_account_id, google_location_id, auto_post_enabled, reply_speed, business_hours, reply_tone')
    .not('google_refresh_token', 'is', null);

  if (error) { console.error('Failed to fetch clients:', error); return; }
  console.log(`Found ${clients.length} client(s) with Google connected.`);

  for (const client of clients) {
    try {
      const accessToken = await getValidAccessToken(client);
      if (!accessToken) {
        console.warn(`Skipping ${client.restaurant_name} — token refresh failed.`);
        continue;
      }

      const reviews   = await getReviews(accessToken, client.google_account_id, client.google_location_id);
      const unanswered = reviews.filter(r => !r.reviewReply);
      console.log(`${client.restaurant_name}: ${reviews.length} reviews, ${unanswered.length} unanswered.`);

      for (const review of unanswered) {
        // Skip if already processed
        const { data: existing } = await supabase
          .from('processed_reviews')
          .select('id')
          .eq('review_id', review.reviewId)
          .maybeSingle();
        if (existing) continue;

        const reviewerName = review.reviewer?.displayName || 'Customer';
        const reviewText   = review.comment || '';
        const starRating   = review.starRating; // e.g. "FIVE" or 5

        // Convert Google's string rating to a number
        const ratingNum = typeof starRating === 'string'
          ? { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[starRating] ?? 5
          : Number(starRating) || 5;

        // Generate AI reply
        const aiReply = await generateReply(reviewText, starRating, client.restaurant_name || 'the restaurant', client.reply_tone || null);

        // Compute scheduling based on client prefs
        const isManual    = !client.auto_post_enabled || client.reply_speed === 'manual';
        const scheduledAt = (!isManual && aiReply)
          ? computeScheduledAt(client.reply_speed, client.business_hours)
          : null;

        const reviewStatus = aiReply ? (isManual ? 'pending' : 'replied') : 'pending';

        // Save to reviews table
        const { error: insertErr } = await supabase.from('reviews').upsert({
          user_id:       client.id,
          review_id:     review.reviewId,
          customer_name: reviewerName,
          review_text:   reviewText,
          ai_reply:      aiReply,
          rating:        ratingNum,
          status:        reviewStatus,
          scheduled_at:  scheduledAt?.toISOString() ?? null,
          created_at:    review.createTime || new Date().toISOString(),
        }, { onConflict: 'review_id' });

        if (insertErr) {
          console.error(`  Failed to save review ${review.reviewId}:`, insertErr.message);
        } else {
          console.log(`  Saved review ${review.reviewId} — status: ${reviewStatus}${scheduledAt ? ` (scheduled ${scheduledAt.toISOString()})` : ''}`);
        }

        // Notify Discord + email owner
        await notifyDiscord(client.restaurant_name, reviewerName, starRating, reviewText, aiReply);
        await sendOwnerEmail(client.id, client.restaurant_name, reviewerName, Number({ ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5 }[starRating] ?? starRating), reviewText, aiReply);

        // Mark as processed so we don't re-fire on next poll
        await supabase.from('processed_reviews').insert({
          review_id: review.reviewId,
          client_id: client.id,
          status:    'queued'
        });
      }
    } catch (err) {
      console.error(`Error polling ${client.restaurant_name} (${client.id}):`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] Poll complete.`);
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function startReviewsPoller() {
  cron.schedule('*/5 * * * *', pollAllClients);
  console.log('Review poller scheduled — running every 5 minutes.');
}

export { startReviewsPoller, pollAllClients };
