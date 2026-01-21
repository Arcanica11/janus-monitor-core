-- =============================================================================
-- MIGRATION 007: PROJECT LOGS (BITÁCORA)
-- =============================================================================

-- 1. CREATE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.project_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. ENABLE RLS
ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Visible to org members (via project organization link is complex due to join, simplified to authenticated for read if they have access to project)
-- Ideally we check if the user belongs to the same organization as the project.
-- Simplification: Join through projects table.

CREATE POLICY "Logs visible to organization members"
    ON public.project_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.project_logs.project_id
            AND (
                (select auth.uid()) in (
                    select id from public.auth_members_view 
                    where organization_id = public.projects.organization_id
                )
                OR public.is_super_admin()
            )
        )
    );

CREATE POLICY "Logs insertable by organization members"
    ON public.project_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.project_logs.project_id
            AND (
                (select auth.uid()) in (
                    select id from public.auth_members_view 
                    where organization_id = public.projects.organization_id
                )
                OR public.is_super_admin()
            )
        )
    );

-- Grant
GRANT ALL ON public.project_logs TO authenticated;
