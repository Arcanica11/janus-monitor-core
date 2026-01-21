-- =============================================================================
-- MIGRATION 008: SOCIAL VAULT (REDES SOCIALES)
-- =============================================================================

-- 1. CREATE SOCIAL VAULT TABLE
CREATE TABLE IF NOT EXISTS public.social_vault (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    platform text NOT NULL, -- 'instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'gmail', 'other'
    username text NOT NULL,
    password text, -- Encrypted content or raw depending on requirements (using text for now)
    recovery_email text,
    url text, -- Login URL
    notes text,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. ENABLE RLS
ALTER TABLE public.social_vault ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
CREATE POLICY "Social Vault visible to organization members"
    ON public.social_vault FOR ALL
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = public.social_vault.organization_id
        )
        OR public.is_super_admin()
    );

-- 4. TRIGGER FOR UPDATED_AT
DROP TRIGGER IF EXISTS handle_updated_at ON public.social_vault;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.social_vault
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 5. GRANT PERMISSIONS
GRANT ALL ON public.social_vault TO authenticated;
