-- ============================================================================
-- CRITICAL DATABASE FIX - Janus Monitor Core
-- Created: 2026-01-23
-- Purpose: Fix audit_logs table and enhance services table for income tracking
-- ============================================================================

-- ============================================================================
-- PART 1: AUDIT LOGS TABLE (Fix PGRST205 Error)
-- ============================================================================

-- Drop existing table if it has issues (use with caution in production)
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, 
  -- Examples: 'DELETE_ITEM', 'VIEW_PASSWORD', 'LOGIN_BLOCKED', 'CREATE_SUBSCRIPTION'
  target_resource text, 
  -- Examples: 'org_subscriptions:123', 'user:456', 'services:789'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Policy 1: Only Super Admins can SELECT (View) logs
CREATE POLICY "Super Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy 2: Authenticated users can INSERT their own audit logs
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- Policy 3: Allow service role to insert audit logs (for system actions)
-- This is important for backend operations that use service key
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 2: ENHANCE SERVICES TABLE (Income/Billing)
-- ============================================================================

-- Add new columns to services table if they don't exist
DO $$ 
BEGIN
  -- Add provider column (e.g., 'Vercel', 'Namecheap', 'InMotion', 'GoDaddy')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.services ADD COLUMN provider text;
  END IF;

  -- Add account_holder column (e.g., 'arknica11', 'ivang111')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'account_holder'
  ) THEN
    ALTER TABLE public.services ADD COLUMN account_holder text;
  END IF;

  -- Add start_date for tracking when service began
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.services ADD COLUMN start_date timestamptz;
  END IF;

  -- Add expiration_date for domain renewals (unified domain management)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'expiration_date'
  ) THEN
    ALTER TABLE public.services ADD COLUMN expiration_date date;
  END IF;

  -- Add renewal_price for domains (can differ from regular cost)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'renewal_price'
  ) THEN
    ALTER TABLE public.services ADD COLUMN renewal_price numeric(10, 2);
  END IF;

  -- Add registrar for domain-specific tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'registrar'
  ) THEN
    ALTER TABLE public.services ADD COLUMN registrar text;
  END IF;

  -- Add service_type to differentiate (hosting, domain, email, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'service_type'
  ) THEN
    ALTER TABLE public.services ADD COLUMN service_type text 
      CHECK (service_type IN ('hosting', 'domain', 'email', 'ssl', 'other'));
  END IF;

  -- Make client_id nullable (for organization-owned services)
  ALTER TABLE public.services ALTER COLUMN client_id DROP NOT NULL;

END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider);
CREATE INDEX IF NOT EXISTS idx_services_account_holder ON public.services(account_holder);
CREATE INDEX IF NOT EXISTS idx_services_expiration_date ON public.services(expiration_date);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON public.services(service_type);

-- ============================================================================
-- PART 3: VERIFICATION QUERIES
-- ============================================================================

-- Verify audit_logs table exists and has correct structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    RAISE NOTICE '✓ audit_logs table exists';
  ELSE
    RAISE EXCEPTION '✗ audit_logs table NOT found!';
  END IF;
END $$;

-- Verify services table has new columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'services' 
             AND column_name = 'provider') THEN
    RAISE NOTICE '✓ services.provider column exists';
  ELSE
    RAISE EXCEPTION '✗ services.provider column NOT found!';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'services' 
             AND column_name = 'account_holder') THEN
    RAISE NOTICE '✓ services.account_holder column exists';
  ELSE
    RAISE EXCEPTION '✗ services.account_holder column NOT found!';
  END IF;
END $$;

-- ============================================================================
-- EXECUTION INSTRUCTIONS
-- ============================================================================
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. Verify success messages in the output
-- 5. Test audit logging and service creation from the app
-- ============================================================================
