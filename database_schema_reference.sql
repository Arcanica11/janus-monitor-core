-- ESTADO ACTUAL DE LA BASE DE DATOS (Jan 2026) --
-- Referencia para futuros agentes. NO ejecutar migraciones anteriores. --

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- ej: 'DELETE_USER', 'VIEW_PASSWORD'
  target_resource text, -- ej: 'user_123', 'credential_55'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Habilita RLS para audit_logs (Solo Super Admin puede ver)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
