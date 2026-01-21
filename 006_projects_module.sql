-- =============================================================================
-- MIGRATION 006: PROJECTS MODULE (WP MIGRATIONS)
-- =============================================================================

-- 1. CREATE PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'qa', 'completed')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    deadline timestamptz NULL,
    budget numeric(10, 2) DEFAULT 0,
    progress int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. ENABLE RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Visible to org members
CREATE POLICY "Projects visible to organization members"
    ON public.projects FOR ALL
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = public.projects.organization_id
        )
        OR public.is_super_admin()
    );

-- 4. TRIGGERS
-- Update timestamp
DROP TRIGGER IF EXISTS handle_updated_at ON public.projects;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Grant
GRANT ALL ON public.projects TO authenticated;
