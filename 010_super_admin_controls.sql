-- =============================================================================
-- MIGRATION 010: SUPER ADMIN CONTROLS
-- =============================================================================

-- 1. UPDATE CLIENTS POLICY
-- Allow DELETE only for Super Admins
DROP POLICY IF EXISTS "Clients updatable by org members" ON public.clients;

-- Separate Update and Delete to be precise
CREATE POLICY "Clients updatable by org members"
  ON public.clients FOR UPDATE
  USING ( is_super_admin() OR organization_id = get_my_org_id() );

CREATE POLICY "Clients deletable by super admins only"
  ON public.clients FOR DELETE
  USING ( is_super_admin() );

-- 2. UPDATE ORGANIZATIONS POLICY
-- Allow DELETE only for Super Admins
CREATE POLICY "Organizations deletable by super admins only"
  ON public.organizations FOR DELETE
  USING ( is_super_admin() );
  
-- Allow UPDATE for Super Admins and Members (though members might be restricted to some fields in UI/Backend)
CREATE POLICY "Organizations updatable by members"
  ON public.organizations FOR UPDATE
  USING ( is_super_admin() OR id = get_my_org_id() );

-- 3. UPDATE PROFILES (USERS) POLICY
-- Allow DELETE only for Super Admins
-- Note: Deleting a profile usually cascades from auth.users, but we can allow deletion of the profile row explicitly if needed.
-- More importantly, we control who can initiate the deletion via Server Action.
CREATE POLICY "Profiles deletable by super admins only"
  ON public.profiles FOR DELETE
  USING ( is_super_admin() );

-- 4. UPDATE PROJECTS POLICY (Example, if projects exist and follow same pattern)
-- Assuming strict hierarchy, deleting Client/Org will cascade delete projects.
-- But if direct delete is needed:
-- CREATE POLICY "Projects deletable by super admins only" ...

-- 5. ENSURE CASCADES
-- (Verify foreign keys in setup_database.sql - confirmed ON DELETE CASCADE for most)

-- 6. GRANT PERMISSIONS
-- Ensure authenticated users can still attempt valid operations (RLS filters them)
GRANT DELETE ON public.clients TO authenticated;
GRANT DELETE ON public.organizations TO authenticated;
GRANT DELETE ON public.profiles TO authenticated;
