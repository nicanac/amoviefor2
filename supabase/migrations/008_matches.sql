-- =============================================================================
-- 008_matches.sql — Mutual right-swipe matches
-- =============================================================================

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  session_movie_id uuid not null references public.session_movies(id) on delete cascade,
  matched_at timestamptz not null default now(),
  unique (session_id, session_movie_id)
);

alter table public.matches enable row level security;

create policy "Users can view matches for their sessions"
  on public.matches for select
  using (
    session_id in (
      select s.id from public.sessions s
      join public.couples c on s.couple_id = c.id
      where c.user1_id = auth.uid() or c.user2_id = auth.uid()
    )
  );

create policy "Users can insert matches for their sessions"
  on public.matches for insert
  with check (
    session_id in (
      select s.id from public.sessions s
      join public.couples c on s.couple_id = c.id
      where c.user1_id = auth.uid() or c.user2_id = auth.uid()
    )
  );

create index idx_matches_session on public.matches(session_id);

-- Enable realtime for instant match notifications
alter publication supabase_realtime add table public.matches;
