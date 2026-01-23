-- ============================================================================
-- CORRECTED SERVICES TABLE SCHEMA
-- This reflects the ACTUAL database schema (name/cost, not service_name/amount)
-- ============================================================================

-- Drop and recreate if needed, or use ALTER to fix column names
-- WARNING: Only run this if you need to fix existing schema

-- Option 1: If table doesn't exist yet, create with correct names
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,
  client_id uuid REFERENCES public.clients(id), -- NULLABLE for org-owned services
  name text NOT NULL, -- Correct: 'name' not 'service_name'
  description text,
  cost numeric(10, 2) NOT NULL DEFAULT 0.00, -- Correct: 'cost' not 'amount'
  currency text DEFAULT 'USD',
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  next_payment_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'pending')),
  
  -- Enhanced fields for unified management
  provider text, -- e.g., 'Vercel', 'Namecheap', 'GoDaddy', 'InMotion'
  account_holder text, -- e.g., 'arknica11', 'ivang111'
  service_type text CHECK (service_type IN ('hosting', 'domain', 'email', 'ssl', 'other')),
  registrar text, -- For domains
  expiration_date date, -- For domain renewals
  renewal_price numeric(10, 2), -- Can differ from initial cost
  start_date timestamptz, -- When service started
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Option 2: If table exists with wrong column names, rename them
-- DO $$ 
-- BEGIN
--   -- Rename service_name to name
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_schema = 'public' 
--     AND table_name = 'services' 
--     AND column_name = 'service_name'
--   ) THEN
--     ALTER TABLE public.services RENAME COLUMN service_name TO name;
--   END IF;
--
--   -- Rename amount to cost
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_schema = 'public' 
--     AND table_name = 'services' 
--     AND column_name = 'amount'
--   ) THEN
--     ALTER TABLE public.services RENAME COLUMN amount TO cost;
--   END IF;
-- END $$;

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super Admins view all services" ON public.services;
DROP POLICY IF EXISTS "Super Admins manage all services" ON public.services;
DROP POLICY IF EXISTS "Org Admins view own services" ON public.services;
DROP POLICY IF EXISTS "Org Admins insert own services" ON public.services;
DROP POLICY IF EXISTS "Org Admins update own services" ON public.services;
DROP POLICY IF EXISTS "Org Admins delete own services" ON public.services;

-- Policies
CREATE POLICY "Super Admins view all services" ON public.services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admins manage all services" ON public.services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Org Admins view own services" ON public.services
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org Admins insert own services" ON public.services
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org Admins update own services" ON public.services
  FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org Admins delete own services" ON public.services
  FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_org_id ON public.services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_client_id ON public.services(client_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider);
CREATE INDEX IF NOT EXISTS idx_services_account_holder ON public.services(account_holder);
CREATE INDEX IF NOT EXISTS idx_services_expiration_date ON public.services(expiration_date);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON public.services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
