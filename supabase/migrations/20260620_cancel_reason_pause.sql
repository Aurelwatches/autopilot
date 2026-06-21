-- Cancel reason + pause support on profiles

alter table profiles
  add column if not exists cancel_reason      text;

alter table profiles
  add column if not exists cancel_reason_at   timestamptz;

alter table profiles
  add column if not exists paused_until       timestamptz;
