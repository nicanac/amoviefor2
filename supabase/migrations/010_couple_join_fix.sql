-- =============================================================================
-- 010_couple_join_fix.sql — Fix RLS issue with joining couples
-- =============================================================================

-- Create a secure function to join a couple (bypasses RLS)
-- This allows user2 to find and join user1's pending couple
create or replace function public.join_couple_by_code(
  p_partner_code text,
  p_user2_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_partner record;
  v_couple record;
begin
  -- Find partner by code
  select id into v_partner
  from public.profiles
  where partner_code = p_partner_code;

  if not found then
    return json_build_object('error', 'Invalid partner code');
  end if;

  if v_partner.id = p_user2_id then
    return json_build_object('error', 'Cannot couple with yourself');
  end if;

  -- Find pending couple where partner is user1
  select * into v_couple
  from public.couples
  where user1_id = v_partner.id
    and status = 'pending'
    and user2_id is null;

  if not found then
    return json_build_object('error', 'No pending invite from this partner');
  end if;

  -- Activate the couple
  update public.couples
  set user2_id = p_user2_id, status = 'active'
  where id = v_couple.id;

  return json_build_object('success', true, 'couple_id', v_couple.id);
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.join_couple_by_code(text, uuid) to authenticated;

-- Create index for pending couple lookups
create index idx_couples_pending_user1
  on public.couples(user1_id)
  where status = 'pending' and user2_id is null;
