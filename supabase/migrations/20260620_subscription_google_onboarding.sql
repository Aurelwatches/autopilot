-- Subscription, Google OAuth, and onboarding columns on profiles

alter table profiles
  add column if not exists subscription_status text,
  add column if not exists plan                text,
  add column if not exists plan_interval       text,
  add column if not exists stripe_customer_id  text,
  add column if not exists onboarded           boolean not null default false;

-- Google Business Profile OAuth tokens
alter table profiles
  add column if not exists google_access_token    text,
  add column if not exists google_refresh_token   text,
  add column if not exists google_token_expires_at timestamptz,
  add column if not exists google_account_id      text,
  add column if not exists google_location_id     text,
  add column if not exists google_connected_at    timestamptz;
