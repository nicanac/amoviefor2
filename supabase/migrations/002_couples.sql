-- =============================================================================
-- 002_couples.sql — Couple formation
-- =============================================================================

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'dissolved')),
  created_at timestamptz not null default now(),
  constraint different_users check (user1_id != user2_id)
);

alter table public.couples enable row level security;

-- RLS: Users can see couples they belong to
create policy "Users can view their own couples"
  on public.couples for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create couples"
  on public.couples for insert
  with check (auth.uid() = user1_id);

create policy "Users can update their own couples"
  on public.couples for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Index for quick lookup
create index idx_couples_user1 on public.couples(user1_id) where status = 'active';
create index idx_couples_user2 on public.couples(user2_id) where status = 'active';
