-- ============================================================
-- AutoPilot — allow users to insert their own activity_feed rows
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
-- The Social Posts page logs a 'post_scheduled' activity row directly
-- from the browser (anon key) when a user schedules a post, so the
-- Overview "Posts Scheduled" stat counts it. activity_feed has RLS
-- enabled with only a SELECT policy for users (server writes via the
-- service role), so client inserts are blocked without this policy.

CREATE POLICY "activity_feed: users insert own"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);
