-- =============================================================================
-- 007_swipes.sql — User swipe actions
-- =============================================================================

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_movie_id uuid not null references public.session_movies(id) on delete cascade,
  direction text not null check (direction in ('right', 'left')),
  swiped_at timestamptz not null default now(),
  unique (session_id, user_id, session_movie_id)
);

alter table public.swipes enable row level security;

-- Users can only see their own swipes (never partner's until match)
create policy "Users can view their own swipes"
  on public.swipes for select
  using (user_id = auth.uid());

create policy "Users can insert their own swipes"
  on public.swipes for insert
  with check (user_id = auth.uid());

create index idx_swipes_session_user on public.swipes(session_id, user_id);
create index idx_swipes_movie on public.swipes(session_movie_id, direction);
