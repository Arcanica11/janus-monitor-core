-- =============================================================================
-- MIGRATION 009: UPTIME MONITOR
-- =============================================================================

-- 1. MODIFY DOMAINS TABLE
-- Add columns to track status code and check time without overwriting the 'active' logical status.
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS last_http_status int,
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- 2. CREATE UPTIME LOGS TABLE
CREATE TABLE IF NOT EXISTS public.uptime_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    status_code int, -- 0 for network error/timeout
    latency_ms int,
    error_message text,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. ENABLE EXTENSIONS FOR CRON JOBS
-- Note: These must be enabled in the Dashboard usually, but SQL can do it if permissions allow.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. RLS FOR UPTIME LOGS
ALTER TABLE public.uptime_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uptime logs visible to organization members"
    ON public.uptime_logs FOR SELECT
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = (select organization_id from public.domains where id = public.uptime_logs.domain_id)
        )
        OR public.is_super_admin()
    );

-- Grant permissions to service role (for edge functions)
GRANT ALL ON public.uptime_logs TO service_role;
GRANT ALL ON public.uptime_logs TO postgres;
GRANT SELECT ON public.uptime_logs TO authenticated;

-- Grant permissions on domains to service role explicitly if needed
GRANT ALL ON public.domains TO service_role;

-- 5. SCHEDULE CRON JOB
-- Schedule to run every 10 minutes.
-- REPLACE 'PROJECT_REF' and 'ANON_KEY' with actual values if running manually, 
-- but in a migration file we usually document this as a manual step or use dynamic querying if possible.
-- Since we can't inject secrets easily here, we will assume this matches the project's Edge Function URL.

-- Example for localhost or production (Modify URL as needed):
-- SELECT cron.schedule(
--   'monitor-domains-job',
--   '*/10 * * * *',
--   $$
--   select
--     net.http_post(
--         url:='https://<PROJECT_REF>.supabase.co/functions/v1/monitor-domains',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
--         body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );

-- IMPORTANT: 
-- Because we need the SERVICE_ROLE_KEY and Project URL which are sensitive/dynamic,
-- we cannot hardcode the CRON creation safely in this static SQL file without them.
-- However, I will provide a function wrapper that makes it easier to call.

CREATE OR REPLACE FUNCTION public.schedule_domain_monitor(
    function_url text, 
    service_key text
) RETURNS bigint AS $$
DECLARE
    job_id bigint;
BEGIN
    -- Remove existing job if any
    PERFORM cron.unschedule('monitor-domains-job');
    
    -- Schedule new job
    SELECT cron.schedule(
        'monitor-domains-job',
        '*/10 * * * *',
        format(
            $sql$
            select
                net.http_post(
                    url:='%s',
                    headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
                    body:='{}'::jsonb
                ) as request_id;
            $sql$,
            function_url,
            service_key
        )
    ) INTO job_id;
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
