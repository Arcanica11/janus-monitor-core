-- ============================================================================
-- CREATE DOMAINS_MASTER TABLE
-- Centralized domain management for organization and client domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.domains_master (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,
  client_id uuid REFERENCES public.clients(id), -- NULL = Internal/Org-owned
  
  -- Domain Information
  domain text NOT NULL, -- e.g., "arknica.com", "ruedalrola.com"
  registrar text, -- e.g., "Namecheap", "GoDaddy"
  
  -- Hosting Information
  hosting_provider text, -- e.g., "Vercel", "InMotion", "AWS"
  account_owner text, -- e.g., "arknica11", "ivang111"
  
  -- Financial & Renewal
  renewal_price numeric(10, 2),
  expiration_date date NOT NULL,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domains_master ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super Admins view all domains" ON public.domains_master;
DROP POLICY IF EXISTS "Super Admins manage all domains" ON public.domains_master;
DROP POLICY IF EXISTS "Org users view own domains" ON public.domains_master;
DROP POLICY IF EXISTS "Org admins manage own domains" ON public.domains_master;

-- Policies
CREATE POLICY "Super Admins view all domains" ON public.domains_master
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admins manage all domains" ON public.domains_master
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Org users view own domains" ON public.domains_master
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org admins manage own domains" ON public.domains_master
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('org_admin', 'super_admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_domains_master_org_id ON public.domains_master(organization_id);
CREATE INDEX IF NOT EXISTS idx_domains_master_client_id ON public.domains_master(client_id);
CREATE INDEX IF NOT EXISTS idx_domains_master_expiration ON public.domains_master(expiration_date);
CREATE INDEX IF NOT EXISTS idx_domains_master_status ON public.domains_master(status);
CREATE INDEX IF NOT EXISTS idx_domains_master_hosting_provider ON public.domains_master(hosting_provider);

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'domains_master') THEN
    RAISE NOTICE '✓ domains_master table created successfully';
  ELSE
    RAISE EXCEPTION '✗ domains_master table NOT found!';
  END IF;
END $$;
