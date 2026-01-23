-- Migration: Create services table (Income/Billing)
-- Created at: 2026-01-22

CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,
  client_id uuid REFERENCES public.clients(id) NOT NULL,
  service_name text NOT NULL, -- e.g. "Hosting Premium", "Dominio .com"
  description text,
  amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  currency text DEFAULT 'USD',
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  next_payment_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Super Admins view all
CREATE POLICY "Super Admins view all services" ON public.services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- 2. Super Admins insert/update/delete all
CREATE POLICY "Super Admins manage all services" ON public.services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- 3. Org Admins view their own organization's income
CREATE POLICY "Org Admins view own services" ON public.services
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- 4. Org Admins insert own services
CREATE POLICY "Org Admins insert own services" ON public.services
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Org Admins update own services
CREATE POLICY "Org Admins update own services" ON public.services
  FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- 6. Org Admins delete own services
CREATE POLICY "Org Admins delete own services" ON public.services
  FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
