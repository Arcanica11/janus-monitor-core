-- =============================================================================
-- MIGRATION 012: ORGANIZATION ENHANCEMENTS
-- =============================================================================

-- 1. UPDATE ORGANIZATIONS TABLE
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS contact_email text;

-- 2. ORG SUBSCRIPTIONS (SaaS, Hosting, Tools)
CREATE TABLE IF NOT EXISTS public.org_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_name text NOT NULL, -- e.g. "Vercel Pro"
    provider text, -- e.g. "Vercel"
    cost numeric(10, 2) DEFAULT 0,
    billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'usage')),
    next_billing_date timestamptz,
    status text DEFAULT 'active', -- active, canceled, past_due
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. ORG ASSETS (Domains, Apps, etc. owned by the org itself)
CREATE TABLE IF NOT EXISTS public.org_assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text CHECK (type IN ('domain', 'website', 'app', 'other')),
    name text NOT NULL, -- URL or App Name
    expiration_date timestamptz, -- For domains
    registrar text, -- Godaddy, Namecheap, etc.
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. ORG VAULT (Credentials)
-- WARNING: Passwords stored here MUST be encrypted at the application layer before insertion.
-- Do NOT store plain text passwords.
CREATE TABLE IF NOT EXISTS public.org_vault (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    service text NOT NULL, -- e.g. "AWS Root"
    username text,
    encrypted_password text, -- Stores IV:Ciphertext
    category text DEFAULT 'general', -- infrastructure, social, banking
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. ENABLE RLS
ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_vault ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Helper to check org membership easily (assuming no complex queries in policies for perf)
-- We use the existing get_my_org_id() function.

-- SUBSCRIPTIONS
CREATE POLICY "Subscriptions viewable by org members"
    ON public.org_subscriptions FOR SELECT
    USING ( is_super_admin() OR organization_id = get_my_org_id() );

CREATE POLICY "Subscriptions updatable by org admin" 
    ON public.org_subscriptions FOR UPDATE
    USING ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) = 'admin') );

CREATE POLICY "Subscriptions deletable by super admin only"
    ON public.org_subscriptions FOR DELETE
    USING ( is_super_admin() );

CREATE POLICY "Subscriptions insertable by org admin"
    ON public.org_subscriptions FOR INSERT
    WITH CHECK ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) = 'admin') );

-- ASSETS
CREATE POLICY "Assets viewable by org members"
    ON public.org_assets FOR SELECT
    USING ( is_super_admin() OR organization_id = get_my_org_id() );

CREATE POLICY "Assets updatable by org admin"
    ON public.org_assets FOR UPDATE
    USING ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) = 'admin') );

CREATE POLICY "Assets deletable by super admin only"
    ON public.org_assets FOR DELETE
    USING ( is_super_admin() );

CREATE POLICY "Assets insertable by org admin"
    ON public.org_assets FOR INSERT
    WITH CHECK ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) = 'admin') );

-- VAULT (Stricter?)
-- Ideally only Org Admins or specific roles see vault.
CREATE POLICY "Vault viewable by org admins only"
    ON public.org_vault FOR SELECT
    USING ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) IN ('admin', 'super_admin')) );

CREATE POLICY "Vault managed by org admins"
    ON public.org_vault FOR ALL
    USING ( is_super_admin() OR (organization_id = get_my_org_id() AND (select role from profiles where id = auth.uid()) IN ('admin')) );

-- GRANT PERMISSIONS
GRANT ALL ON public.org_subscriptions TO authenticated;
GRANT ALL ON public.org_assets TO authenticated;
GRANT ALL ON public.org_vault TO authenticated;
