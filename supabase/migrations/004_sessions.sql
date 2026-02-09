-- =============================================================================
-- 004_sessions.sql — Movie-finding sessions
-- =============================================================================

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  status text not null default 'answering' check (status in ('answering', 'matching', 'swiping', 'completed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.sessions enable row level security;

-- RLS: Users can see sessions for couples they belong to
create policy "Users can view sessions for their couples"
  on public.sessions for select
  using (
    couple_id in (
      select id from public.couples
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "Users can create sessions for their couples"
  on public.sessions for insert
  with check (
    couple_id in (
      select id from public.couples
      where (user1_id = auth.uid() or user2_id = auth.uid()) and status = 'active'
    )
  );

create policy "Users can update sessions for their couples"
  on public.sessions for update
  using (
    couple_id in (
      select id from public.couples
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create index idx_sessions_couple on public.sessions(couple_id, status);

-- Enable realtime for sessions
alter publication supabase_realtime add table public.sessions;
