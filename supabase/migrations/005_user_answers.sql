-- =============================================================================
-- 005_user_answers.sql — User answers per session
-- =============================================================================

create table public.user_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id int not null references public.questions(id) on delete cascade,
  answer jsonb not null,
  answered_at timestamptz not null default now(),
  unique (session_id, user_id, question_id)
);

alter table public.user_answers enable row level security;

-- RLS: Users can see their own answers
create policy "Users can view their own answers"
  on public.user_answers for select
  using (user_id = auth.uid());

create policy "Users can insert their own answers"
  on public.user_answers for insert
  with check (user_id = auth.uid());

create policy "Users can update their own answers"
  on public.user_answers for update
  using (user_id = auth.uid());

create index idx_user_answers_session on public.user_answers(session_id, user_id);

-- Enable realtime for answer progress tracking
alter publication supabase_realtime add table public.user_answers;
