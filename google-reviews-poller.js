// google-reviews-poller.js
// Polls Google Business Profile for every AutoPilot client, finds unanswered
// reviews, and fires them to Make.com for AI response generation.
// Runs on a schedule (cron) inside your existing Express/Railway backend.

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function refreshGoogleToken(client) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: client.google_refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();

  if (!data.access_token) {
    console.error(`Failed to refresh token for client ${client.id}:`, data);
    return null;
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from('profiles')
    .update({
      google_access_token: data.access_token,
      google_token_expires_at: expiresAt
    })
    .eq('id', client.id);

  return data.access_token;
}

export async function getValidAccessToken(client) {
  const expiresAt = new Date(client.google_token_expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (!client.google_token_expires_at || (expiresAt.getTime() - now.getTime()) < bufferMs) {
    return await refreshGoogleToken(client);
  }

  return client.google_access_token;
}

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

async function pollAllClients() {
  console.log(`[${new Date().toISOString()}] Starting review poll...`);

  const { data: clients, error } = await supabase
    .from('profiles')
    .select('id, restaurant_name, google_access_token, google_refresh_token, google_token_expires_at, google_account_id, google_location_id')
    .not('google_refresh_token', 'is', null);

  if (error) {
    console.error('Failed to fetch clients from Supabase:', error);
    return;
  }

  console.log(`Found ${clients.length} client(s) with Google connected.`);

  for (const client of clients) {
    try {
      const accessToken = await getValidAccessToken(client);
      if (!accessToken) {
        console.warn(`Skipping ${client.restaurant_name} — token refresh failed.`);
        continue;
      }

      const reviews = await getReviews(accessToken, client.google_account_id, client.google_location_id);
      const unanswered = reviews.filter(r => !r.reviewReply);

      console.log(`${client.restaurant_name}: ${reviews.length} reviews, ${unanswered.length} need a response.`);

      for (const review of unanswered) {
        const { data: existing } = await supabase
          .from('processed_reviews')
          .select('id')
          .eq('review_id', review.reviewId)
          .maybeSingle();

        if (existing) continue;

        await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: client.id,
            restaurant_name: client.restaurant_name,
            reviewer_name: review.reviewer?.displayName || 'Customer',
            star_rating: review.starRating,
            review_text: review.comment || '',
            review_id: review.reviewId
          })
        });

        await supabase.from('processed_reviews').insert({
          review_id: review.reviewId,
          client_id: client.id,
          status: 'queued'
        });

        console.log(`  Queued review ${review.reviewId} for AI response.`);
      }
    } catch (err) {
      console.error(`Error polling ${client.restaurant_name} (${client.id}):`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] Poll complete.`);
}

function startReviewsPoller() {
  cron.schedule('*/5 * * * *', pollAllClients);
  console.log('Review poller scheduled — running every 5 minutes.');
}

export { startReviewsPoller, pollAllClients };
