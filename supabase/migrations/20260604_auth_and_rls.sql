-- ============================================================
-- AutoPilot — Auth + RLS migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Profiles table (mirrors auth.users for server-side lookup)
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Add user_id to existing tables
ALTER TABLE messages     ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE reviews      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE activity_feed ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Enable Row Level Security
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "profiles: users read own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users insert own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── messages ──────────────────────────────────────────────────
CREATE POLICY "messages: users read own"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "messages: users insert own"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow the API server (service role) to update messages with replies
-- Service role bypasses RLS automatically — no extra policy needed.

-- ── reviews ───────────────────────────────────────────────────
CREATE POLICY "reviews: users read own"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Server (service role) inserts reviews via webhook — bypasses RLS.

-- ── activity_feed ─────────────────────────────────────────────
CREATE POLICY "activity_feed: users read own"
  ON activity_feed FOR SELECT
  USING (auth.uid() = user_id);

-- Server (service role) inserts activity — bypasses RLS.

-- ============================================================
-- Notes:
-- • The service role key used in server.js bypasses RLS,
--   so webhook inserts work without extra policies.
-- • After running this migration, disable "Confirm email" in
--   Supabase Auth → Settings if you want instant login on signup.
-- ============================================================
