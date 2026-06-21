-- Run this in the Supabase SQL editor to create the messages table.

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  message      text not null,
  reply        text,
  created_at   timestamptz not null default now(),
  replied_at   timestamptz,
  status       text not null default 'open' check (status in ('open', 'replied'))
);

-- Allow the anon key to read/insert (no auth in this app).
-- Disable RLS or add open policies so the frontend can operate.
alter table public.messages enable row level security;

create policy "allow_all" on public.messages
  for all using (true) with check (true);
