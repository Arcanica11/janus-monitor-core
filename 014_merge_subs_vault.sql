-- =============================================================================
-- MIGRATION 014: MERGE SUBSCRIPTIONS AND VAULT
-- =============================================================================

-- 1. UPDATE org_subscriptions (Fusion: Services + Credentials)
ALTER TABLE public.org_subscriptions
ADD COLUMN IF NOT EXISTS login_email text,
ADD COLUMN IF NOT EXISTS login_password text, -- Plain text intentionally for now (UI shows hidden)
ADD COLUMN IF NOT EXISTS tier text; -- e.g. "Pro", "Enterprise"

-- 2. CREATE org_corporate_emails (For internal email accounts)
CREATE TABLE IF NOT EXISTS public.org_corporate_emails (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email_address text NOT NULL,
    password text,
    assigned_to text, -- Name of employee
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. ENABLE RLS for org_corporate_emails
ALTER TABLE public.org_corporate_emails ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES for org_corporate_emails
CREATE POLICY "Corp Emails viewable by org admins"
    ON public.org_corporate_emails FOR SELECT
    USING ( is_super_admin() OR organization_id = get_my_org_id() );

CREATE POLICY "Corp Emails managed by org admins"
    ON public.org_corporate_emails FOR ALL
    USING ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) = 'admin') );

GRANT ALL ON public.org_corporate_emails TO authenticated;

-- 5. DROP org_vault (Obsolete)
DROP TABLE IF EXISTS public.org_vault CASCADE;
