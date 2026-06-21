-- ============================================================
-- AutoPilot — automation preferences on profiles
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reply_speed      text    NOT NULL DEFAULT 'within_1h',
  ADD COLUMN IF NOT EXISTS post_tone        text    NOT NULL DEFAULT 'friendly',
  ADD COLUMN IF NOT EXISTS auto_post_enabled boolean NOT NULL DEFAULT true;

-- Note: profiles already has SELECT/INSERT/UPDATE policies from
-- 20260604_auth_and_rls.sql — no additional RLS changes needed.
