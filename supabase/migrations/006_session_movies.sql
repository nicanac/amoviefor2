-- =============================================================================
-- 006_session_movies.sql — Movies recommended for a session
-- =============================================================================

create table public.session_movies (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  tmdb_id int not null,
  title text not null,
  poster_path text not null default '',
  overview text not null default '',
  release_year int not null default 2000,
  genres jsonb not null default '[]',
  vote_average real not null default 0,
  match_score real not null default 0 check (match_score >= 0 and match_score <= 1),
  rank int not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, tmdb_id)
);

alter table public.session_movies enable row level security;

create policy "Users can view session movies for their couples"
  on public.session_movies for select
  using (
    session_id in (
      select s.id from public.sessions s
      join public.couples c on s.couple_id = c.id
      where c.user1_id = auth.uid() or c.user2_id = auth.uid()
    )
  );

create policy "System can insert session movies"
  on public.session_movies for insert
  with check (
    session_id in (
      select s.id from public.sessions s
      join public.couples c on s.couple_id = c.id
      where c.user1_id = auth.uid() or c.user2_id = auth.uid()
    )
  );

create index idx_session_movies_session on public.session_movies(session_id, rank);
