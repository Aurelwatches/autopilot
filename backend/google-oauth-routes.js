// google-oauth-routes.js
// Two routes: one starts the Google login for a client, one receives Google's
// response and stores that client's tokens in Supabase. Add both to your
// Express app (server.js) alongside your existing routes.

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const REDIRECT_URI = `${process.env.BACKEND_URL}/api/auth/google/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
].join(' ');

router.get('/api/auth/google/connect', (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).send('Missing user_id');
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: user_id
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: user_id } = req.query;

  if (!code || !user_id) {
    return res.status(400).send('Missing code or user_id');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('Token exchange failed:', tokens);
      return res.status(400).send('Google did not return an access token. Try connecting again.');
    }

    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const accountsData = await accountsRes.json();
    const googleAccountId = accountsData.accounts?.[0]?.name?.split('/')[1];

    if (!googleAccountId) {
      return res.status(400).send('No Google Business account found for this login. Make sure they are an owner or manager of a Business Profile.');
    }

    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${googleAccountId}/locations?readMask=name,title`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const locationsData = await locationsRes.json();
    const rawLocations = locationsData.locations ?? [];

    // Build a clean list of { id, name } for the picker and storage
    const allLocations = rawLocations.map(loc => ({
      id:   loc.name?.split('/')[1] ?? '',
      name: loc.title ?? loc.name ?? 'Unknown location',
    })).filter(l => l.id);

    if (allLocations.length === 0) {
      return res.status(400).send('No Google Business locations found. Make sure this account manages at least one Business Profile.');
    }

    const googleLocationId = allLocations[0].id;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: expiresAt,
        google_account_id: googleAccountId,
        google_location_id: googleLocationId,
        google_locations: allLocations,
        google_connected_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) {
      console.error('Failed to save tokens to Supabase:', error);
      return res.status(500).send('Connected to Google, but failed to save. Contact support.');
    }

    // If multiple locations, send to picker so they can choose which one to manage
    if (allLocations.length > 1) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?choose_location=true&google_connected=true`);
    }

    res.redirect(`${process.env.FRONTEND_URL}/settings?google_connected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Something went wrong connecting your Google account. Please try again.');
  }
});

export default router;
