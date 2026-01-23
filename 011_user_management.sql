-- =============================================================================
-- MIGRATION 011: USER MANAGEMENT ENHANCEMENTS
-- =============================================================================

-- 1. ADD IS_BLOCKED COLUMN
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- 2. UPDATE RLS FOR PROFILES
-- We need Super Admins to be able to UPDATE any profile (to change role, block, etc.)
-- Previous policies might have been 'Users can see own profile' and 'Super admins see all'.
-- We need an UPDATE policy.

DROP POLICY IF EXISTS "Profiles updatable by super admins" ON public.profiles;

CREATE POLICY "Profiles updatable by super admins"
  ON public.profiles FOR UPDATE
  USING ( is_super_admin() );

-- Ensure users can update their own non-sensitive fields if needed (optional for now, focusing on Admin)
-- CREATE POLICY "Users can update own profile" ... (Implemented if needed later)

-- 3. FUNCTION TO PREVENT BLOCKED LOGIN (Optional / Future Proofing)
-- This logic usually lives in Middleware or Login Action, checking the DB.
-- But we can create a convenient view or function if needed.
-- For now, the column existence is sufficient for the application layer check.

-- 4. GRANT PERMISSIONS
GRANT UPDATE ON public.profiles TO authenticated;
