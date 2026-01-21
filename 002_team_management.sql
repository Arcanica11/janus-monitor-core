-- =============================================================================
-- MIGRATION 002: TEAM MANAGEMENT & SECURE USER FETCHING
-- =============================================================================

-- 1. Helper Function to get Profiles with Email (Joins auth.users)
-- This function is SECURITY DEFINER to access auth.users, but we restrict it in logic.
-- It only returns data if the caller is a super_admin.

create or replace function public.get_profiles_with_email()
returns table (
  id uuid,
  full_name text,
  role public.app_role,
  email varchar,
  organization_name text,
  organization_id uuid
) 
security definer
as $$
begin
  -- RBAC Check: Only Super Admins can execute this query logic
  if not public.is_super_admin() then
    raise exception 'Access Denied: Super Admin role required';
  end if;

  return query
  select 
    p.id,
    p.full_name,
    p.role,
    u.email::varchar,
    o.name as organization_name,
    p.organization_id
  from public.profiles p
  join auth.users u on p.id = u.id
  left join public.organizations o on p.organization_id = o.id
  order by p.created_at desc;
end;
$$ language plpgsql;

-- 2. Helper to get all organizations (Simple select wrapper or direct query is fine, 
-- but let's ensure we have a policy for seeing all orgs if super_admin 
-- (Already covered by "Organizations are viewable by members and super admins" policy mostly, 
-- but super admin needs to see ALL to assign them).
-- The existing policy `is_super_admin() OR ...` covers it.

-- 3. Grant execute permission (Explicitly needed sometimes depending on default privs)
grant execute on function public.get_profiles_with_email() to authenticated;
