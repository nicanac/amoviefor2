-- =============================================================================
-- 009_seen_movies.sql — Movies already watched by users
-- =============================================================================

create table public.seen_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id int not null,
  source text not null default 'manual' check (source in ('auto', 'manual')),
  marked_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

alter table public.seen_movies enable row level security;

create policy "Users can view their own seen movies"
  on public.seen_movies for select
  using (user_id = auth.uid());

create policy "Users can insert their own seen movies"
  on public.seen_movies for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own seen movies"
  on public.seen_movies for delete
  using (user_id = auth.uid());

create index idx_seen_movies_user on public.seen_movies(user_id, tmdb_id);
