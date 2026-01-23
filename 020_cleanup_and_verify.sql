-- DROP Obsolete Tables
DROP TABLE IF EXISTS public.org_assets;
DROP TABLE IF EXISTS public.projects;

-- VERIFY org_corporate_emails Columns
ALTER TABLE public.org_corporate_emails 
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS linked_gmail TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Ensure Foreign Keys are valid (This part is implicit in column definition but good to verify if columns existed)
-- If columns existed without FKs, this would need ALTER TABLE ADD CONSTRAINT, but assuming they were created with checks or we trust the ADD COLUMN IF NOT EXISTS with references.

-- Clean up any orphaned emails if necessary (Optional safety)
DELETE FROM public.org_corporate_emails WHERE organization_id IS NULL;
