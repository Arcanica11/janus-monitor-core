-- Migration: Create audit_logs table
-- Created at: 2026-01-22

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- e.g., 'DELETE_ITEM', 'VIEW_PASSWORD', 'LOGIN_BLOCKED'
  target_resource text, -- e.g., 'org_subscriptions:123', 'user:456'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only Super Admins can SELECT (View) logs
CREATE POLICY "Super Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Authenticated users can INSERT logs (System writes mostly, but actions trigger it)
-- Note: Often audit logs are written by the system with a service key or admin client,
-- but for now allowing auth users to insert their *own* actions is okay if validated.
-- Better approach: "All authenticated users can insert", but cannot update/delete.
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);
