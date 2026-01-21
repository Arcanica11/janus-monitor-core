-- =============================================================================
-- MIGRATION 003: EXPANDING FEATURES (CLIENTS, CREDENTIALS, SERVICES)
-- =============================================================================

-- 1. EXTEND CLIENTS TABLE
-- Notes: Adding contact and business details
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS notes text;

-- 2. EXTEND DOMAINS TABLE
-- Notes: Adding management details
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hosting_provider text,
ADD COLUMN IF NOT EXISTS provider_account text;

-- 3. CREATE CREDENTIALS VAULT TABLE
-- Notes: storage for client access. 'password_hash' currently meant for encrypted strings.
CREATE TABLE IF NOT EXISTS public.credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('social_media', 'database', 'cms', 'hosting', 'other', 'email', 'dashboard')),
    service_name text NOT NULL, -- e.g. "Wordpress Admin", "cPanel"
    username text,
    password_hash text, -- Encrypted content or raw depending on implementation level
    url text, -- Login URL
    notes text,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS for Credentials
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the same organization can view/edit
CREATE POLICY "Credentials visible to organization members"
    ON public.credentials FOR ALL
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = public.credentials.organization_id
        )
        OR public.is_super_admin()
    );

-- 4. CREATE SERVICES TABLE (RECURRING COSTS)
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g. "Hosting Anual", "Mantenimiento Mensual"
    cost numeric(10, 2) DEFAULT 0,
    billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
    next_billing_date date,
    status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'pending')),
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the same organization can view/edit
CREATE POLICY "Services visible to organization members"
    ON public.services FOR ALL
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = public.services.organization_id
        )
         OR public.is_super_admin()
    );

-- 5. UPDATED_AT TRIGGER (Reusing existing function if available, or creating generic)
-- Assuming handle_updated_at function exists from setup_database.sql. 
-- If not, we rely on the implementation to handle it or add it here.
-- Adding triggers just in case.
DROP TRIGGER IF EXISTS handle_updated_at ON public.credentials;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.credentials
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_updated_at ON public.services;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Grant permissions (ensure authenticated users can interact via RLS)
GRANT ALL ON public.credentials TO authenticated;
GRANT ALL ON public.services TO authenticated;
