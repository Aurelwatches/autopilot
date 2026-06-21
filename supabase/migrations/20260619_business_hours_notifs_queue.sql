-- Business hours, notification prefs, and auto-reply queue support

-- 1. business_hours: { enabled, open, close, timezone }
alter table profiles
  add column if not exists business_hours jsonb default '{"enabled":true,"open":"09:00","close":"21:00","timezone":"America/New_York"}'::jsonb;

-- 2. notification_prefs: { sms, email, weekly, alerts, phone }
alter table profiles
  add column if not exists notification_prefs jsonb default '{"sms":false,"email":true,"weekly":true,"alerts":true,"phone":""}'::jsonb;

-- 3. scheduled_at on reviews — when to auto-post the reply to Google
alter table reviews
  add column if not exists scheduled_at timestamptz;

-- Index so the auto-reply cron is fast
create index if not exists reviews_pending_scheduled
  on reviews (scheduled_at)
  where status = 'pending' and scheduled_at is not null;
