-- ============================================================
-- AutoPilot — link activity_feed rows to the post that created them
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
-- When a user schedules a post, the Social Posts page logs a
-- 'post_scheduled' activity row. Adding a post_id reference lets us
-- delete that activity row cleanly when the post is deleted.
--
-- ON DELETE CASCADE is a safety net: deleting a post also removes its
-- linked activity row at the database level even if the client-side
-- cleanup is skipped. The DELETE policy lets users remove their own
-- activity rows directly from the browser.

ALTER TABLE activity_feed
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES posts(id) ON DELETE CASCADE;

CREATE POLICY "activity_feed: users delete own"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);
