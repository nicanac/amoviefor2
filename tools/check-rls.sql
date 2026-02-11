
-- Check current RLS policies on user_answers
select *
from pg_policies
where tablename = 'user_answers';
