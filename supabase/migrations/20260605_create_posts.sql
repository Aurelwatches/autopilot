-- ============================================================
-- AutoPilot — Social Posts table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Stores user-created social post drafts / scheduled posts.
-- Unlike reviews & activity_feed (which the server writes via the
-- service role), posts are created and deleted directly from the
-- browser with the anon key, so this table needs full owner RLS
-- policies for INSERT / SELECT / UPDATE / DELETE.

CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     text NOT NULL DEFAULT 'Instagram',
  content      text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'draft',   -- 'draft' | 'scheduled' | 'published'
  scheduled_at timestamptz,                      -- null for drafts
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: users read own"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "posts: users insert own"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: users update own"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "posts: users delete own"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS posts_user_created_idx
  ON posts (user_id, created_at DESC);
