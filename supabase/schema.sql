-- Run this in the Supabase SQL editor once, after creating a free project.
-- It creates three tables, enables realtime, and opens anon access
-- (Choir is intentionally login-free — anyone with the room code is inside).

create table if not exists public.rooms (
  id text primary key,
  created_at timestamptz default now(),
  ended_at timestamptz,
  ended_by text
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  display_name text not null,
  colour text not null,
  joined_at timestamptz default now(),
  last_active_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  body text not null,
  created_at timestamptz default now(),
  classification jsonb
);

create index if not exists idx_participants_room on public.participants(room_id);
create index if not exists idx_messages_room_created on public.messages(room_id, created_at);

-- Enable Realtime on these tables.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.messages;

-- Row Level Security with open policies.
-- Choir has no login — the anon key is the only key the browser uses.
-- Gate access by knowledge of the 5-character room code.
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.messages enable row level security;

create policy "rooms read"    on public.rooms          for select using (true);
create policy "rooms insert"  on public.rooms          for insert with check (true);
create policy "rooms update"  on public.rooms          for update using (true) with check (true);
create policy "parts read"    on public.participants   for select using (true);
create policy "parts insert"  on public.participants   for insert with check (true);
create policy "parts delete"  on public.participants   for delete using (true);
create policy "msgs read"     on public.messages       for select using (true);
create policy "msgs insert"   on public.messages       for insert with check (true);
create policy "msgs update"   on public.messages       for update using (true) with check (true);

-- 14-day garbage collection. Run as a scheduled Postgres cron (Supabase "Database" → "Cron Jobs").
-- Or call manually from a Vercel Cron hitting an API route.
create or replace function public.choir_gc()
returns void language plpgsql as $$
begin
  delete from public.rooms where created_at < now() - interval '14 days';
end;
$$;
